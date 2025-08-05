# 🛠️ Setup Instructions for `my-auth-app`

This guide installs all required tools and runs the Next.js + PostgreSQL + NextAuth + Prisma app.

---

## ✅ 1. Install System Requirements

### Ubuntu / Debian
```bash
sudo apt update
sudo apt install nodejs npm postgresql postgresql-contrib
```

Optional (if node version is too old):
```bash
sudo npm install -g n
sudo n latest
```

### Fedora
```bash
sudo dnf install nodejs npm postgresql postgresql-contrib postgresql-server

sudo mkdir -p /var/lib/pgsql/data
sudo chown postgres:postgres /var/lib/pgsql/data
sudo -u postgres /usr/bin/initdb -D /var/lib/pgsql/data
```

Start the server 
```bash
#in Forground mode
sudo -u postgres /usr/bin/postgres -D /var/lib/pgsql/data

#or in Background mode
sudo -u postgres /usr/bin/pg_ctl -D /var/lib/pgsql/data -l /var/lib/pgsql/data/logfile start
```

To stop background server
```bash
s aux | grep "postgres -D"
sudo kill -9 <PID>
```


---

## ✅ 2. Create PostgreSQL User and Database

```bash
sudo adduser postgres
sudo -u postgres psql
```

Start psql
```bash
sudo -u postgres psql
```

In the psql prompt:
```sql
CREATE USER guttih WITH PASSWORD 'hunter2';
CREATE DATABASE guttihdb OWNER guttih;
ALTER ROLE guttih CREATEDB;
\q
```

---

## ✅ 4. Install Node.js Packages

```bash
npm init -y
npm install next react react-dom
npm install next-auth npm bcrypt

npm install -D typescript @types/react @types/node
npm install -D tsx
npx prisma migrate dev --name init
npx tsx prisma/seed.ts
```

---

## ✅ 5. Install Dev Tools (if needed)

If you're missing `tsx`:
```bash
npm install -D tsx
```

---

## ✅ 6. Initialize Prisma and Seed DB

```bash
npx prisma migrate dev --name init
npx tsx prisma/seed.ts
```

---

## ✅ 7. Run the App

```bash
npm run dev
```

Then open: [http://localhost:3000/login](http://localhost:3000/login)

Login credentials:

- **Email:** `admin@guttih.com`
- **Password:** `hunter2`

---

## ✅ 8. Optional: Browse DB in Prisma Studio

```bash
npx prisma studio
```

Opens a UI at [http://localhost:5555](http://localhost:5555)

---

## 💥 You’re Done!
