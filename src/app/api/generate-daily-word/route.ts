import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import crypto from 'crypto';

/**
 * This API route is a proxy to the Python serverless function
 * It's mainly used for local development since in production
 * the Vercel cron job will call the Python function directly
 */
export async function GET(request: NextRequest) {
  try {
    // Security checks
    
    // 1. Check if this is a Vercel cron job (Vercel sets this header)
    const isVercelCron = process.env.VERCEL_CRON === '1';
    
    // Check if we're in development mode
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // 2. Check for the secret key in the Authorization header
    const authHeader = request.headers.get('authorization');
    const secretKey = process.env.CRON_SECRET_KEY;
    const providedKey = authHeader ? authHeader.replace('Bearer ', '') : null;
    
    // 3. Check the request IP (optional additional security)
    const requestIp = request.headers.get('x-forwarded-for') || '';
    const allowedIps = (process.env.ALLOWED_IPS || '').split(',').map(ip => ip.trim());
    const isAllowedIp = allowedIps.includes(requestIp) || allowedIps.length === 0;
    
    // 4. Special handling for Vercel cron jobs
    // Vercel cron jobs don't support custom headers, so we need a different approach
    // We'll use the fact that Vercel sets VERCEL_CRON=1 when the cron job runs
    // This is more secure than relying on the path alone
    
    // Only proceed if:
    // - It's a Vercel cron job (automatic and secure), OR
    // - It has a valid secret key AND (is from an allowed IP OR no IP restrictions), OR
    // - We're in development mode (local testing)
    const isAuthorized = isVercelCron || 
      (secretKey && secretKey === providedKey && (isAllowedIp || allowedIps.length === 0)) ||
      isDevelopment;
    
    if (!isAuthorized) {
      // Log the attempt with a hash of the IP for privacy
      const ipHash = crypto.createHash('sha256').update(requestIp).digest('hex').substring(0, 8);
      console.warn(`Unauthorized access attempt from IP hash: ${ipHash}`);
      
      // Return a generic error to avoid leaking information
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // In production, this route is not used (the Python function is called directly)
    // In development, we need to run the Python script
    if (isDevelopment) {
      // Import these modules only in development
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const path = await import('path');
      const fs = await import('fs');
      
      const execAsync = promisify(exec);
      
      // Get the root directory of the project
      const rootDir = process.cwd();
      
      // Ensure the data directory exists
      const dataDir = path.join(rootDir, 'public', 'data');
      if (!fs.existsSync(dataDir)) {
        console.log(`Creating data directory: ${dataDir}`);
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      // Check if history.json exists, if not, copy the seed file if available
      const historyPath = path.join(dataDir, 'history.json');
      const seedPath = path.join(dataDir, 'history.json.seed');
      
      if (!fs.existsSync(historyPath) && fs.existsSync(seedPath)) {
        console.log('Copying history.json.seed to history.json');
        fs.copyFileSync(seedPath, historyPath);
      }
      
      // Path to the Python script
      const scriptPath = path.join(rootDir, 'scripts', 'generate_daily_word.py');
      
      // Check if we need to run the clean_wordlist script first
      const wordlistPath = path.join(dataDir, 'semantle_wordlist.txt');
      if (!fs.existsSync(wordlistPath)) {
        console.log('Wordlist not found, running clean_wordlist.py first...');
        const cleanScriptPath = path.join(rootDir, 'scripts', 'clean_wordlist.py');
        
        // Run the clean_wordlist.py script
        await execAsync(`python ${cleanScriptPath} --input ${path.join(rootDir, 'public', 'data', 'wordlist.tsv')} --output ${wordlistPath}`);
      }
      
      // In a production environment, we'd use a Python virtual environment
      // For simplicity in this example, we'll use the system Python
      console.log('Running generate_daily_word.py...');
      try {
        const { stdout, stderr } = await execAsync(`python ${scriptPath}`);
        
        // Check if stderr contains actual errors or just progress output
        const hasRealError = stderr && 
          !stderr.includes('UserWarning') && 
          !stderr.includes('Processing words:') && 
          !stderr.includes('Computing similarities:');
        
        if (hasRealError) {
          console.error('Error generating daily word:', stderr);
          
          return NextResponse.json(
            { 
              error: 'Failed to generate daily word', 
              details: stderr,
              command: `python ${scriptPath}`,
              cwd: process.cwd()
            },
            { status: 500 }
          );
        }
        
        return NextResponse.json({
          success: true,
          message: 'Daily word generated successfully',
          details: stdout,
          stderr: stderr // Include stderr for debugging in development
        });
      } catch (execError: unknown) {
        console.error('Error executing Python script:', execError);
        
        return NextResponse.json(
          { 
            error: 'Failed to execute Python script', 
            details: execError instanceof Error ? execError.message : String(execError),
            command: `python ${scriptPath}`,
            cwd: process.cwd(),
            path: process.env.PATH
          },
          { status: 500 }
        );
      }
    } else {
      // In production, redirect to the Python serverless function
      // This should never be called since the cron job calls the Python function directly
      return NextResponse.json({
        success: true,
        message: 'In production, please use the Python serverless function directly'
      });
    }
  } catch (error: unknown) {
    console.error('Error in generate-daily-word API route:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}
