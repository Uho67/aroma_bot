# Aroma with Image Bot

A Telegram bot application with a Vue.js frontend dashboard for managing aromas and images. This application allows users to interact with a Telegram bot to manage and share aroma-related content with images.

## Features

- Telegram bot integration for aroma management
- Vue.js dashboard for content administration
- Image upload and management
- Database storage with PostgreSQL
- RESTful API backend
- Real-time updates

## Project Structure

```
aroma_with_image_bot/
├── backend/               # Node.js backend server
│   ├── src/              # Source code
│   ├── prisma/           # Database schema and migrations
│   └── uploads/          # Image upload directory
└── frontend/             # Vue.js frontend application
    ├── src/              # Source code
    ├── public/           # Static assets
    └── dist/             # Production build output
```

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher) or yarn (v1.22 or higher)
- PostgreSQL (v12 or higher)
- Telegram Bot Token (from [BotFather](https://t.me/botfather))
- Git

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/aroma_with_image_bot.git
cd aroma_with_image_bot
```

### 2. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory:
   ```env
   # Database Configuration
   DATABASE_URL="postgresql://username:password@localhost:5432/your_database_name"
   
   # Telegram Bot Configuration
   TELEGRAM_BOT_TOKEN="your_telegram_bot_token"
   
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   
   # Optional: File Upload Configuration
   MAX_FILE_SIZE=5242880  # 5MB in bytes
   ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif
   ```

4. Set up the database:
   ```bash
   # Generate Prisma client
   npm run prisma:generate

   # Run database migrations
   npm run prisma:migrate

   # (Optional) Seed the database with initial data
   npm run prisma:seed
   ```

5. Start the backend server:
   ```bash
   # Development mode with hot reload
   npm run dev

   # Production mode
   npm start
   ```

### 3. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the frontend directory:
   ```env
   # API Configuration
   VITE_API_URL="http://localhost:3000"
   
   # Optional: Feature Flags
   VITE_ENABLE_ANALYTICS=false
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

## Development

### Local Development

- Backend runs on `http://localhost:3000` by default
- Frontend development server runs on `http://localhost:5173` by default
- The frontend will proxy API requests to the backend during development
- Hot reload is enabled for both frontend and backend

### API Documentation

The backend API documentation is available at `http://localhost:3000/api-docs` when running in development mode.

### Database Management

- Use Prisma Studio to manage your database:
  ```bash
  cd backend
  npx prisma studio
  ```

### Environment Variables

#### Backend (.env)
| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | - |
| TELEGRAM_BOT_TOKEN | Telegram bot token | - |
| PORT | Server port | 3000 |
| NODE_ENV | Environment mode | development |
| MAX_FILE_SIZE | Maximum file upload size | 5242880 |
| ALLOWED_FILE_TYPES | Allowed file types | image/jpeg,image/png,image/gif |

#### Frontend (.env)
| Variable | Description | Default |
|----------|-------------|---------|
| VITE_API_URL | Backend API URL | http://localhost:3000 |
| VITE_ENABLE_ANALYTICS | Enable analytics | false |

## Production Deployment

### Backend Deployment

1. Set up a production environment:
   ```bash
   cd backend
   npm install --production
   ```

2. Configure production environment variables

3. Build and start the server:
   ```bash
   npm start
   ```

### Frontend Deployment

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Deploy the contents of `frontend/dist` to your web server

3. Configure your web server to handle client-side routing

## Serving the Frontend with Nginx and Managing Production Builds

In production, the frontend is typically served as static files using Nginx. The build output (`frontend/dist`) is served directly to users. Stopping the development server (Vite/PM2) does not affect the static site served by Nginx.

### Nginx Configuration Example

```
server {
    listen 80;
    server_name your_domain_or_ip;
    root /var/www/aroma_bot/frontend/dist;
    index index.html;

    access_log /var/log/nginx/aroma_bot.access.log;
    error_log /var/log/nginx/aroma_bot.error.log;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets {
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }

    location ~ /\. {
        deny all;
    }
}
```

### Common Actions

#### 1. Temporarily Disable the Frontend (Show 404)

Rename or move the `dist` directory:
```bash
mv /var/www/aroma_bot/frontend/dist /var/www/aroma_bot/frontend/dist_backup
sudo systemctl reload nginx
```

#### 2. Show a Maintenance Page

Replace the main `index.html` with a maintenance message:
```bash
echo "<h1>Site Under Maintenance</h1>" > /var/www/aroma_bot/frontend/dist/index.html
find /var/www/aroma_bot/frontend/dist -type f ! -name 'index.html' -delete
sudo systemctl reload nginx
```

#### 3. Disable the Nginx Site

Edit your Nginx config and comment out or remove the relevant `server` block, then reload Nginx:
```bash
sudo systemctl reload nginx
```

#### 4. Re-enable the Frontend

- If you moved the directory back:
  ```bash
  mv /var/www/aroma_bot/frontend/dist_backup /var/www/aroma_bot/frontend/dist
  sudo systemctl reload nginx
  ```
- If you want to update the frontend, rebuild it:
  ```bash
  cd /var/www/aroma_bot/frontend
  npm run build
  sudo systemctl reload nginx
  ```

#### 5. Update the Frontend with a New Build

1. Make your changes in the Vue app.
2. Build the new static files:
   ```bash
   cd /var/www/aroma_bot/frontend
   npm run build
   sudo systemctl reload nginx
   ```

#### 6. Check Nginx Status and Logs

- Check Nginx status:
  ```bash
  sudo systemctl status nginx
  ```
- View access logs:
  ```bash
  tail -f /var/log/nginx/aroma_bot.access.log
  ```
- View error logs:
  ```bash
  tail -f /var/log/nginx/aroma_bot.error.log
  ```

> **Note:** Stopping the frontend dev server (Vite/PM2) does not affect the static site served by Nginx. To fully stop or update the frontend, use the steps above.

## Available Scripts

### Backend
| Script | Description |
|--------|-------------|
| `npm start` | Start the production server |
| `npm run dev` | Start the development server with hot reload |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:seed` | Seed the database with initial data |
| `npm run test` | Run tests |
| `npm run lint` | Run linting |

### Frontend
| Script | Description |
|--------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build locally |
| `npm run test` | Run tests |
| `npm run lint` | Run linting |

## Dependencies

### Backend
- Express.js - Web framework
- Prisma - Database ORM
- node-telegram-bot-api - Telegram bot integration
- cors - Cross-origin resource sharing
- multer - File upload handling
- dotenv - Environment variable management
- winston - Logging

### Frontend
- Vue.js 3 - Frontend framework
- Vue Router - Routing
- Axios - HTTP client
- Vite - Build tool and development server
- Pinia - State management
- Vue I18n - Internationalization

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Verify PostgreSQL is running
   - Check DATABASE_URL in .env
   - Ensure database exists

2. **Telegram Bot Not Responding**
   - Verify TELEGRAM_BOT_TOKEN
   - Check bot permissions
   - Ensure backend is running

3. **Image Upload Failures**
   - Check file size limits
   - Verify allowed file types
   - Ensure upload directory exists

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Write tests for new features
- Update documentation as needed
- Use conventional commits

## License

This project is licensed under the ISC License.

## Support

For support, please:
1. Check the [documentation](docs/)
2. Search [existing issues](https://github.com/yourusername/aroma_with_image_bot/issues)
3. Create a new issue if needed 

## Managing the Backend with PM2

For production environments, it is recommended to use [PM2](https://pm2.keymetrics.io/) to manage the backend process. PM2 ensures your backend stays running, can automatically restart on failure, and provides easy process management.

### Install PM2 Globally

```bash
npm install -g pm2
```

### Start the Backend with PM2

```bash
cd backend
npm install --production
npm run build # (if you have a build step, otherwise skip)
npm start    # (for initial test, then stop it to use PM2)

# Start with PM2
pm2 start src/index.js --name "aroma-backend"
```

### Common PM2 Commands

- **Check status of all processes:**
  ```bash
  pm2 status
  ```
- **View logs:**
  ```bash
  pm2 logs aroma-backend
  ```
- **Restart the backend:**
  ```bash
  pm2 restart aroma-backend
  ```
- **Stop the backend:**
  ```bash
  pm2 stop aroma-backend
  ```
- **Remove the backend from PM2:**
  ```bash
  pm2 delete aroma-backend
  ```

### Auto-start PM2 on Server Boot

To ensure your backend restarts automatically after a server reboot, run:
```bash
pm2 startup
pm2 save
```

### Notes
- Make sure your environment variables are set (e.g., in `.env` or via your shell) before starting with PM2.
- You can manage multiple processes (backend, frontend dev server, etc.) with PM2.
- For more advanced usage, see the [PM2 documentation](https://pm2.keymetrics.io/docs/usage/quick-start/). 