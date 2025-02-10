# Semantic Word Game

A word game where players try to guess a target word using semantic similarity. Each guess is scored based on how semantically similar it is to the target word.

## Features

- Daily word challenge
- Semantic similarity scoring
- Word validation
- Beautiful UI with animations
- Multiplayer mode with private rooms

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Game Logic**: In-memory word storage and similarity calculations
- **UI Components**: Framer Motion for animations

## Getting Started

1. Clone the repository and install dependencies:
```bash
git clone https://github.com/yourusername/semantic-word-game.git
cd semantic-word-game
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Game Rules

1. Try to guess the target word of the day
2. Each guess will be scored based on its semantic similarity to the target word
3. The closer your guess is semantically to the target word, the higher your score
4. Keep guessing until you find the exact word!

## Project Structure

- `/src`
  - `/app` - Next.js app router pages
  - `/components` - React components
  - `/lib` - Game logic and utilities
  - `/types` - TypeScript type definitions

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
