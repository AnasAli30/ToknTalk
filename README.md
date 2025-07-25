# 🚀 ToknTalk - Decentralized Social Media on Internet Computer

<div align="center">

![ToknTalk Logo](https://img.shields.io/badge/ToknTalk-Social%20Media-blue?style=for-the-badge&logo=internet-computer)
![Internet Computer](https://img.shields.io/badge/Internet%20Computer-Platform-green?style=for-the-badge&logo=internet-computer)
![Rust](https://img.shields.io/badge/Rust-Backend-orange?style=for-the-badge&logo=rust)
![React](https://img.shields.io/badge/React-Frontend-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-Language-blue?style=for-the-badge&logo=typescript)

**A fully decentralized social media platform built on the Internet Computer with built-in crypto wallet, AI integration, and modern responsive design.**

[![Deploy to Internet Computer](https://img.shields.io/badge/Deploy%20to-Internet%20Computer-blue?style=for-the-badge&logo=internet-computer)](https://internetcomputer.org/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg?style=for-the-badge)](https://opensource.org/licenses/ISC)

</div>

---

## 📋 Table of Contents

- [🌟 Features](#-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Quick Start](#-quick-start)
- [📱 Screenshots](#-screenshots)
- [🏗️ Architecture](#️-architecture)
- [🔧 Development](#-development)
- [📦 Deployment](#-deployment)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## 🌟 Features

### 🎯 Core Social Features
- **📝 Posts & Content** - Create, edit, and share posts with text and images
- **❤️ Reactions** - Like, comment, and reshare posts with real-time updates
- **👥 User Profiles** - Customizable profiles with avatars, bios, and social stats
- **🔍 Search & Discovery** - Search users, posts, and hashtags with smart filtering
- **📱 Responsive Design** - Mobile-first design that works on all devices
- **🌙 Dark/Light Theme** - Beautiful theme switching with smooth transitions

### 💰 Built-in Crypto Wallet
- **🏦 Native Wallet** - In-canister wallet with ICRC-1 token support
- **💸 Token Transfers** - Send ICP tokens to other users seamlessly
- **💰 Direct Tips** - Tip users directly from their profiles with $ button
- **📊 Transaction History** - Complete transaction tracking and history
- **🔐 Secure Storage** - Principal-based authentication and secure transfers

### 🤖 AI Integration
- **💬 AI Chat Agents** - Intelligent chat bots with smart contract execution
- **🧠 LLM Integration** - AI-powered content generation and assistance
- **🔧 Tool Calls** - AI agents can execute actions through smart contracts
- **📝 Content Enhancement** - AI-assisted post creation and optimization

### 🎨 Modern UI/UX
- **📱 Mobile-First** - Fully responsive design with mobile navigation
- **🎭 Smooth Animations** - Framer Motion powered transitions and effects
- **🎨 Modern Design** - Clean, elegant interface with Tailwind CSS
- **⚡ Fast Performance** - Optimized for speed and user experience
- **🔔 Real-time Updates** - Live notifications and activity feeds

### 🔐 Security & Privacy
- **🔑 Internet Identity** - Secure authentication with DFINITY's II
- **🛡️ On-Chain Security** - All data stored securely on the Internet Computer
- **🔒 Privacy First** - User data remains private and decentralized
- **🔄 Censorship Resistant** - No central authority can censor content

---

## 🛠️ Tech Stack

### Backend (Rust)
- **🦀 Rust** - High-performance backend development
- **🏗️ Internet Computer** - Decentralized platform infrastructure
- **📋 Candid** - Interface definition language for IC canisters
- **🔧 DFX** - Internet Computer development framework
- **🤖 IC-LLM** - AI integration for intelligent features

### Frontend (React/TypeScript)
- **⚛️ React 19** - Modern React with latest features
- **📘 TypeScript** - Type-safe development
- **🎨 Tailwind CSS** - Utility-first CSS framework
- **🎭 Framer Motion** - Declarative animations
- **🔧 Vite** - Fast build tool and dev server
- **📱 Lucide React** - Beautiful icon library

### Authentication & Identity
- **🔑 Internet Identity** - DFINITY's authentication system
- **👤 Principal Management** - Secure user identification
- **🔄 Session Management** - Persistent user sessions

### Development Tools
- **📦 PNPM** - Fast package manager
- **🔍 Prettier** - Code formatting
- **🧪 Vitest** - Unit testing framework
- **🐕 Husky** - Git hooks for code quality

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **Rust** (latest stable)
- **DFX** (v0.25.0 or higher)
- **PNPM** (recommended package manager)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/tokntalk.git
   cd tokntalk
   ```

2. **Install dependencies (IMPORTANT: Use --force)**
   ```bash
   npm i --force
   ```

3. **Start the local Internet Computer**
   ```bash
   dfx start
   ```

4. **Deploy the application**
   ```bash
   dfx deploy --no-wallet
   ```

5. **Open the application**
   ```
   Frontend: http://bkyz2-fmaaa-aaaaa-qaaaq-cai.localhost:4943/
   ```

### Development Commands

```bash
# Start development server
npm run dev

# Build the application
npm run build

# Run tests
npm run test

# Format code
npm run format

# Lint code
npm run lint
```

---

## 📱 Screenshots

### 🏠 Landing Page
- Modern hero section with animated background
- Feature showcase with interactive elements
- Responsive design for all devices

### 📱 Mobile Experience
- Mobile-first navigation with slide-out menu
- Touch-friendly interface
- Optimized for mobile performance

### 💰 Wallet Interface
- Built-in crypto wallet with ICP support
- Transaction history and balance tracking
- Direct tipping functionality

### 🎨 Theme Support
- Dark and light theme switching
- Smooth theme transitions
- Consistent design across all views

---

## 🏗️ Architecture

### Canister Structure
```
├── backend/          # Rust backend canister
├── frontend/         # React frontend assets
├── internet_identity/ # Authentication canister
└── llm/             # AI integration canister
```

### Key Components

#### Backend (Rust)
- **User Management** - Profile creation, authentication, social connections
- **Content System** - Posts, comments, likes, reshares
- **Wallet System** - Token management, transfers, transaction history
- **AI Integration** - LLM integration, chat agents, smart contract execution
- **Search & Discovery** - User search, hashtag search, trending topics

#### Frontend (React)
- **Landing Page** - Modern marketing page with animations
- **Feed View** - Main social media feed with posts and interactions
- **Profile System** - User profiles, editing, following/followers
- **Wallet Interface** - Crypto wallet with transfer capabilities
- **Chat System** - Real-time messaging with AI agents
- **Search & Explore** - Advanced search and discovery features

### Data Flow
1. **Authentication** → Internet Identity → Principal ID
2. **User Actions** → Frontend → Backend Canister → IC Network
3. **Content Creation** → Posts/Comments → On-chain Storage
4. **Wallet Operations** → Token Transfers → Transaction History
5. **AI Integration** → LLM Canister → Smart Contract Execution

---

## 🔧 Development

### Project Structure
```
IC-Vibe-Coding-Template-Rust/
├── src/
│   ├── backend/           # Rust backend canister
│   │   ├── src/lib.rs     # Main backend logic
│   │   ├── backend.did    # Candid interface
│   │   └── Cargo.toml     # Rust dependencies
│   ├── frontend/          # React frontend
│   │   ├── src/
│   │   │   ├── components/    # Reusable UI components
│   │   │   ├── views/         # Page components
│   │   │   ├── services/      # API services
│   │   │   ├── context/       # React context providers
│   │   │   └── utils/         # Utility functions
│   │   ├── package.json       # Frontend dependencies
│   │   └── vite.config.ts     # Vite configuration
│   └── declarations/      # Generated Candid types
├── dfx.json              # DFX configuration
├── package.json          # Root package.json
└── README.md            # This file
```

### Key Features Implementation

#### 🎯 Social Media Features
- **Posts**: Create, edit, delete posts with text and images
- **Comments**: Threaded comments with real-time updates
- **Likes/Reshares**: Social interactions with notification system
- **Profiles**: Customizable user profiles with avatars and bios
- **Follow System**: Follow/unfollow users with mutual connections

#### 💰 Crypto Wallet Features
- **Wallet Creation**: Automatic wallet creation for new users
- **Token Transfers**: Send ICP tokens to other users
- **Direct Tips**: Tip users directly from their profiles
- **Transaction History**: Complete transaction tracking
- **Balance Management**: Real-time balance updates

#### 🤖 AI Integration Features
- **Chat Agents**: AI-powered chat bots
- **Smart Contracts**: AI agents can execute smart contracts
- **Content Generation**: AI-assisted content creation
- **Tool Calls**: AI agents with function calling capabilities

#### 📱 Responsive Design Features
- **Mobile Navigation**: Slide-out menu with backdrop blur
- **Responsive Layout**: Adapts to all screen sizes
- **Touch-Friendly**: Optimized for mobile interaction
- **Theme Support**: Dark/light theme with smooth transitions

---

## 📦 Deployment

### Local Development
```bash
# Start local IC
dfx start

# Deploy to local IC
dfx deploy --no-wallet

# Access the application
open http://bkyz2-fmaaa-aaaaa-qaaaq-cai.localhost:4943/
```

### Mainnet Deployment
```bash
# Deploy to mainnet
dfx deploy --network ic --no-wallet

# Set canister controllers
dfx canister update-settings --all --controller <your-principal-id>
```

### Environment Configuration
```bash
# Set environment variables
export DFX_NETWORK=ic
export INTERNET_IDENTITY_URL=https://identity.ic0.app
```

---

## 🎯 All Features Summary

### ✅ Core Social Media
- [x] User registration and authentication with Internet Identity
- [x] Create, edit, and delete posts with text content
- [x] Image upload and embedding in posts
- [x] Like, comment, and reshare posts
- [x] User profiles with avatars, bios, and social stats
- [x] Follow/unfollow system with mutual connections
- [x] Real-time notifications for social interactions
- [x] Search users and posts by keywords
- [x] Hashtag system with trending topics
- [x] Personalized feed based on following
- [x] Post viewer with full post details and comments

### ✅ Crypto Wallet Integration
- [x] Built-in crypto wallet for each user
- [x] ICP token transfers between users
- [x] Direct tipping from user profiles ($ button)
- [x] Transaction history with sender/receiver details
- [x] Real-time balance updates
- [x] Principal ID display and copy functionality
- [x] Test ICP distribution for development
- [x] Secure transaction validation

### ✅ AI & Chat Features
- [x] AI-powered chat agents
- [x] LLM integration for content generation
- [x] Smart contract execution through AI agents
- [x] Tool calling capabilities
- [x] Real-time messaging system
- [x] Chat threads and message history
- [x] AI-assisted content creation

### ✅ Modern UI/UX
- [x] Responsive design for all devices (mobile, tablet, desktop)
- [x] Mobile-first navigation with slide-out menu
- [x] Dark and light theme switching
- [x] Smooth animations with Framer Motion
- [x] Modern design with Tailwind CSS
- [x] Loading states and error handling
- [x] Touch-friendly interface
- [x] Backdrop blur effects
- [x] Professional color scheme and typography

### ✅ Advanced Features
- [x] Real-time notifications system
- [x] Trending topics and hashtags
- [x] User search and discovery
- [x] Post search and filtering
- [x] Image viewer with full-screen support
- [x] Emoji picker for posts
- [x] Profile completion flow
- [x] Session management and persistence
- [x] Error handling and user feedback
- [x] Performance optimization

### ✅ Technical Features
- [x] Internet Computer canister architecture
- [x] Rust backend with Candid interfaces
- [x] React frontend with TypeScript
- [x] Vite build system for fast development
- [x] Tailwind CSS for styling
- [x] Framer Motion for animations
- [x] Internet Identity authentication
- [x] Principal-based user identification
- [x] On-chain data storage
- [x] Decentralized architecture

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Style
- Use Prettier for code formatting
- Follow TypeScript best practices
- Write meaningful commit messages
- Add comments for complex logic

---

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **DFINITY Foundation** - For the Internet Computer platform
- **Internet Identity** - For secure authentication
- **React Team** - For the amazing frontend framework
- **Rust Team** - For the powerful backend language
- **Tailwind CSS** - For the utility-first CSS framework
- **Framer Motion** - For smooth animations

---

<div align="center">

**Built with ❤️ on the Internet Computer**

[![Internet Computer](https://img.shields.io/badge/Internet%20Computer-Platform-green?style=for-the-badge&logo=internet-computer)](https://internetcomputer.org/)
[![DFINITY](https://img.shields.io/badge/DFINITY-Foundation-blue?style=for-the-badge)](https://dfinity.org/)

</div>
