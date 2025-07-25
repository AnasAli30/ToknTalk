import { AuthClient } from "@dfinity/auth-client";
import { Identity } from "@dfinity/agent";

// Internet Identity canister ID
const II_LOCAL_CANISTER_ID = process.env.CANISTER_ID_INTERNET_IDENTITY || "rdmx6-jaaaa-aaaaa-aaadq-cai";

// Host URL for Internet Identity
const II_URL = process.env.DFX_NETWORK === "ic" 
  ? "https://identity.ic0.app" 
  : `http://${II_LOCAL_CANISTER_ID}.localhost:4943/`;

console.log("Internet Identity URL:", II_URL);
console.log("II_LOCAL_CANISTER_ID:", II_LOCAL_CANISTER_ID);
console.log("DFX_NETWORK:", process.env.DFX_NETWORK);

export interface AuthState {
  isAuthenticated: boolean;
  identity: Identity | null;
  principal: string | null;
}

class AuthService {
  private authClient: AuthClient | null = null;
  
  async initialize(): Promise<AuthState> {
    console.log("Initializing auth client");
    try {
      this.authClient = await AuthClient.create();
      console.log("Auth client created");
      
      const isAuthenticated = await this.authClient.isAuthenticated();
      console.log("isAuthenticated:", isAuthenticated);
      
      let identity = null;
      let principal = null;
      
      if (isAuthenticated) {
        identity = this.authClient.getIdentity();
        principal = identity.getPrincipal().toString();
        console.log("Authenticated with principal:", principal);
      }
      
      return {
        isAuthenticated,
        identity,
        principal
      };
    } catch (error) {
      console.error("Error initializing auth client:", error);
      return {
        isAuthenticated: false,
        identity: null,
        principal: null
      };
    }
  }
  
  async login(): Promise<AuthState> {
    console.log("Starting login process");
    if (!this.authClient) {
      console.log("Auth client not initialized, initializing now");
      await this.initialize();
    }
    
    return new Promise<AuthState>((resolve, reject) => {
      console.log("Calling authClient.login with identityProvider:", II_URL);
      this.authClient!.login({
        identityProvider: II_URL,
        onSuccess: async () => {
          console.log("Login successful");
          const identity = this.authClient!.getIdentity();
          const principal = identity.getPrincipal().toString();
          console.log("Authenticated with principal:", principal);
          
          resolve({
            isAuthenticated: true,
            identity,
            principal
          });
        },
        onError: (error: any) => { // Explicitly type error as any to resolve linter error
          console.error("Login failed:", error);
          reject(error);
        }
      });
    });
  }
  
  async logout(): Promise<void> {
    console.log("Logging out");
    if (!this.authClient) {
      console.log("Auth client not initialized, initializing now");
      await this.initialize();
    }
    
    await this.authClient!.logout();
    console.log("Logout successful");
    
    // Clear any local storage or state
    window.location.reload();
  }
  
  getAuthClient(): AuthClient | null {
    return this.authClient;
  }
}

export const authService = new AuthService(); 