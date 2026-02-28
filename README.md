# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

### Ejecutar en local (frontend + API)

Para tener la app completa en local (página web + backend API):

1. **Dependencias del backend** (una vez, en la carpeta del backend):
   ```sh
   cd backend
   pip install -r requirements.txt
   cd ..
   ```
2. **Base de datos (MySQL o SQLite):**
   - En `backend/` copia `.env.example` a `.env`.
   - **Para MySQL:** en `.env` define `SQLALCHEMY_DATABASE_URL` con tu conexión, por ejemplo:
     ```env
     SQLALCHEMY_DATABASE_URL=mysql+mysqlconnector://root:tu_password@localhost:3306/hotel_robles
     ```
     (Crea la base `hotel_robles` en MySQL si no existe; las tablas se crean solas al arrancar el backend.)
   - **Para usar solo SQLite en local** (sin MySQL): no pongas `SQLALCHEMY_DATABASE_URL` en `.env`, o añade `USE_SQLITE=1`. Se usará `backend/local.db`.
3. **Arrancar en dos terminales:**
   - **Terminal 1 – API** (puerto 8000):
     ```sh
     npm run dev:backend
     ```
     (En Windows, si falla, abre una terminal en la carpeta `backend` y ejecuta: `python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000`.)
   - **Terminal 2 – Frontend** (puerto 8080):
     ```sh
     npm run dev
     ```
4. Abre **http://localhost:8080** en el navegador. La API se usará en `http://localhost:8000` de forma automática en local.

### Estructura del proyecto

```
hotel/
├── src/                 # Frontend (React + Vite + TypeScript)
│   ├── components/
│   ├── config/
│   ├── contexts/
│   ├── hooks/
│   ├── pages/
│   └── ...
├── public/              # Assets estáticos del frontend
├── backend/             # API FastAPI (Python)
│   ├── main.py          # Rutas y app FastAPI
│   ├── database.py      # Conexión BD (MySQL o SQLite)
│   ├── models.py        # Modelos SQLAlchemy
│   ├── .env.example
│   └── requirements.txt
├── api/                 # Entrada serverless para Vercel (redirige a backend)
│   ├── index.py
│   └── requirements.txt
├── index.html
├── package.json
├── vite.config.ts
└── vercel.json
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
