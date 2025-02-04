# Semantic Word Game

A French word guessing game based on semantic proximity, inspired by games like Semantle. Players try to guess a secret word by entering words that are semantically related, receiving feedback in the form of temperature (semantic similarity) and progress indicators.

## Features

- Daily word challenge that updates at midnight (US Pacific Time)
- Semantic similarity scoring using advanced NLP techniques
- Progress bar indicating proximity to the target word
- Private rooms for playing with friends
- Beautiful, modern UI with smooth animations
- Mobile-friendly design

## Technical Stack

- **Frontend**: Next.js 14, TailwindCSS, DaisyUI, Framer Motion
- **Backend**: Supabase (PostgreSQL + Auth)
- **NLP**: spaCy with French language model for semantic analysis

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up Supabase:
- Create a new Supabase project
- Run the schema.sql file in the Supabase SQL editor
- Copy your Supabase credentials

3. Create a .env.local file with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:
```bash
npm run dev
```

## Word Similarity Computation

To compute word similarities for the game:

1. Install Python dependencies:
```bash
cd scripts
pip install -r requirements.txt
```

2. Prepare a text file with French words (one per line)

3. Run the similarity computation script:
```bash
python compute_similarities.py input_words.txt output_similarities.json
```

4. Import the generated similarities into Supabase using the provided SQL functions

## Development

The project structure is organized as follows:

- `/src/components` - React components
- `/src/app` - Next.js app router pages
- `/supabase` - Database schema and functions
- `/scripts` - Python scripts for word processing

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
