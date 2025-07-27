![github-submission-banner](https://cdn.dorahacks.io/static/files/1976f1055dec5982fae1b21492e835fb.jpg)

# 🚀 ToknTalk

>  Decentralized Social Media on Internet Computer


<div align="left">

**A fully decentralized social media platform built on the Internet Computer with built-in crypto wallet, AI integration, and modern responsive design.**

</div>

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

---

## 🚀 Deployment and build info (use Linux)

Follow these steps to run the ToknTalk project locally:

```bash
# Clone the repository
git clone https://github.com/yourusername/tokntalk.git
cd tokntalk
```
Install Rust
```bash
sudo apt update
sudo apt install build-essential

# Install Rust using rustup
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Configure your Shell Environment
source $HOME/.cargo/env

# Verify the Installation.
rustc --version
cargo --version
```

run and deploy the build
```bash
# Install dependencies (force install to resolve conflicts)
npm install --force

# In 1st terminal Start the local Internet Computer 
dfx start #

# In 2st terminal Deploy the application
dfx deploy --no-wallet
```

Now you will get something like this:
```bash 
URLs:
  Frontend canister via browser:
    frontend:
      - http://bkyz2-fmaaa-aaaaa-qaaaq-cai.localhost:4943/ (Recommended)
      - http://127.0.0.1:4943/?canisterId=bkyz2-fmaaa-aaaaa-qaaaq-cai (Legacy)
    internet_identity:
      - http://bd3sg-teaaa-aaaaa-qaaba-cai.localhost:4943/ (Recommended)
      - http://127.0.0.1:4943/?canisterId=bd3sg-teaaa-aaaaa-qaaba-cai (Legacy)
  Backend canister via Candid interface:
    backend: http://127.0.0.1:4943/?canisterId=be2us-64aaa-aaaaa-qaabq-cai&id=bnz7o-iuaaa-aaaaa-qaaaa-cai
    internet_identity: http://127.0.0.1:4943/?canisterId=be2us-64aaa-aaaaa-qaabq-cai&id=bd3sg-teaaa-aaaaa-qaaba-cai
    llm: http://127.0.0.1:4943/?canisterId=be2us-64aaa-aaaaa-qaabq-cai&id=w36hm-eqaaa-aaaal-qr76a-cai
```
These are the Login (internet identity) url and Frontend url. 
#### <b>Create your account using the ``frontend Link``</b>

---

## 🧰 ICP Tech Stack

- **Internet Computer (ICP)** – Core blockchain platform  
- **dfx SDK** – CLI tool used for building and deploying canisters  
- **Rust** – Backend language used to write canister logic  
- **Canisters** – Smart contracts used for storing posts, wallets, and app logic  
- **Candid** – Interface format for front-end and back-end communication  
- **ICP On-chain Storage** – Stores content and logic fully on-chain  

---

## 🧱 Challenges During Build

### 1. Figuring out the right tech stack  
We spent time exploring tools and platforms that support AI + Web3 without making things too complex.

### 2. Setting up wallets and token logic  
Getting basic token transfers and wallet features working smoothly was tricky at first.

### 3. Keeping the UI simple  
It was hard to design something that feels like a normal social app but runs on blockchain tech.

### 4. Learning how to integrate AI  
We’re still experimenting with how to use AI in a useful (not gimmicky) way inside the chat.

### 5. Managing limited time and resources  
As a small team, balancing dev work, design, and testing is an ongoing challenge.

---

## 🔮 Future Plans

- **Finish core features**  
  Complete post, chat, wallet, and tipping functionalities.

- **Integrate AI agents**  
  Add helpful bots that can summarize chats, assist with tasks, or send tokens.

- **Launch mini app system**  
  Let developers build and launch plug-ins inside the social platform.

- **Improve UI/UX**  
  Make the app more intuitive and smooth for both crypto and non-crypto users.

- **Test with early users**  
  Get real feedback from a small group and iterate based on their experience.
