# Pathfinder Backend

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   - Copy `.env.example` to `.env`
   - Fill in your Firebase credentials
   - **IMPORTANT:** Never commit the `.env` file or Firebase service account JSON files to Git!

3. **Firebase Service Account:**
   - Download your Firebase service account key from Firebase Console
   - Place it in `src/config/` directory
   - Update `src/config/firebase.ts` to reference your key file
   - **IMPORTANT:** This file is gitignored and should never be committed!

4. **Run the server:**
   ```bash
   npm run dev
   ```

## Security Notes

- `.env` files contain sensitive credentials and are gitignored
- Firebase service account JSON files contain private keys and are gitignored
- Never commit these files to version control
- If accidentally committed, rotate the credentials immediately

## Environment Variables

See `.env.example` for required environment variables.
