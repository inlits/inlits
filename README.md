# Inlits - Stories, Ideas, and Communities Unite.

Welcome to Inlits, a platform designed to connect readers, writers, and thinkers in a shared space of stories and ideas. This project is built using React, Tailwind CSS, and Supabase, offering a modern and engaging experience for users to discover, create, and discuss content.

## Key Features

*   **Content Discovery:** Explore a wide range of articles, e-books, audiobooks, and podcasts across various categories.
*   **Creator Tools:** Empower writers and creators with tools to publish and manage their content.
*   **Community Engagement:** Connect with like-minded individuals through book clubs, discussions, and learning challenges.
*   **Personalized Experience:** Customize your reading preferences, track your learning goals, and build your personal library.
*   **Offline Access:** Access cached content even without an internet connection, thanks to Service Worker implementation.

## Technologies Used

*   **Frontend:**
    *   React: A JavaScript library for building user interfaces.
    *   Tailwind CSS: A utility-first CSS framework for styling the application.
    *   Lucide React: Beautifully simple icons for a polished UI.
    *   Vite: A build tool that provides a fast and efficient development experience.
*   **Backend:**
    *   Supabase: A backend-as-a-service platform providing database, authentication, and storage solutions.

## Project Structure

├── .env                      # Environment variables  
├── eslint.config.js          # ESLint configuration  
├── index.html                # Main HTML file  
├── netlify.toml              # Netlify configuration  
├── package.json              # Project dependencies and scripts  
├── postcss.config.js         # PostCSS configuration  
├── public                    # Public assets served directly  
│   ├── _redirects            # Netlify redirects  
│   └── offline.html          # Offline page  
├── src                       # Source code  
│   ├── App.tsx               # Main application component  
│   ├── components            # Reusable React components  
│   ├── lib                   # Utility functions and hooks  
│   └── pages                 # Application pages  
├── tailwind.config.js        # Tailwind CSS configuration  
├── tsconfig.app.json         # TypeScript configuration  
└── vite.config.ts            # Vite configuration  



## Setting up the project

1.  **Clone the repository:**
    ```bash
    git clone <https://github.com/inlits/inlits.git>
    cd inlits
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
    
3.  **Run the development server:**
    ```bash
    npm run dev
    ```
    This will start the Vite development server and open the application in your browser.

## Deployment

This project is configured for deployment on Netlify. To deploy:

1.  Create a Netlify account (if you don't have one).
2.  Install the Netlify CLI: `npm install -g netlify-cli`
3.  Link your local project to Netlify: `netlify link`
4.  Deploy your site: `netlify deploy --prod`

## Contributing

Contributions are welcome! Please feel free to submit pull requests, report bugs, or suggest new features.

