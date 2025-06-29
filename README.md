# Barkly Research Platform

A sophisticated community research dashboard focusing on Indigenous-led research methodologies, particularly the Barkly Regional Deal Youth Case Study. The platform uses storytelling, systems thinking, and interactive visualization to make complex community data accessible and actionable.

## 🌟 Features

- **Youth Voices**: Real stories from young people sharing their experiences
- **Interactive Visualizations**: Systems maps and data flow diagrams
- **UMEL Framework**: Indigenous-led research methodology implementation
- **Choose Your Adventure**: Interactive scenarios for exploring different perspectives
- **Cultural Sensitivity**: Built with respect for Indigenous data sovereignty

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/barkly-research-platform.git

# Navigate to the project directory
cd barkly-research-platform

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🏗️ Project Structure

```
barkly-research-platform/
├── src/
│   ├── app/                    # Next.js App Router pages
│   ├── components/
│   │   ├── core/              # Reusable UI components
│   │   ├── visualization/     # Chart and data viz components
│   │   ├── storytelling/      # Narrative-driven components
│   │   └── frameworks/        # Analysis framework components
│   ├── data/
│   │   ├── projects/          # Project-specific data
│   │   ├── schemas/           # TypeScript data structures
│   │   └── transformers/      # Data processing utilities
│   ├── hooks/                 # Custom React hooks
│   ├── utils/                 # Utility functions
│   └── styles/                # Tailwind configurations
├── docs/                      # Documentation
├── public/                    # Static assets
└── cursor-rules/              # Cursor IDE configurations
```

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React Context / Zustand (TBD)
- **Data Visualization**: D3.js / Recharts (TBD)
- **Accessibility**: WCAG 2.1 AA compliant

## 📚 Documentation

- [Project Knowledge](./docs/project-knowledge/) - Research documents and protocols
- [Development Guide](./docs/development/) - Technical documentation
- [User Guides](./docs/user-guides/) - Platform usage instructions

## 🤝 Cultural Protocols

This platform handles sensitive Indigenous community data. We follow:

- **CARE+ Principles**: Collective benefit, Authority to control, Responsibility, Ethics + Cultural safety
- **Indigenous Data Sovereignty**: Respecting community ownership and control
- **Cultural Sensitivity**: Appropriate handling of sacred and sensitive knowledge

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run e2e tests
npm run test:e2e

# Run accessibility tests
npm run test:a11y
```

## 📦 Building for Production

```bash
# Create production build
npm run build

# Run production server
npm start
```

## 🚀 Deployment

The application is configured for deployment on:
- Vercel (recommended)
- AWS Amplify
- Netlify

## 🤝 Contributing

Please read our [Contributing Guidelines](./CONTRIBUTING.md) before submitting PRs.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgements

We acknowledge the Traditional Owners of the lands on which we work and pay our respects to Elders past, present and emerging.

Special thanks to the Barkly youth and community members who shared their stories and insights.
