# St Mary's Cathedral Website

This project is a website and admin system for St Mary's Cathedral, Wrexham.

The public website is built with React. The backend and admin API are built with Laravel. The main aim of the project is to let the cathedral manage website content from an admin dashboard instead of editing static pages by hand.

## Project Team

- Frontend design and Figma UI files by Keerthu.
- Backend system, admin panel, database, API, and integration by Dunura.

## What The Website Does

The public website shows information for visitors and parish members.

It includes:

- Home page
- Mass and Sacraments pages
- Parish pages
- Parish Council page
- Parish Groups page
- News and Events pages
- Events calendar
- Weekly newsletter archive
- Contact page
- Parish registration form
- Group join/contact forms

Most public content comes from the Laravel backend. This means admins can update events, news, newsletters, groups, and parish council members from the dashboard.

## Public Website Rules

- Published events are shown on the public website.
- Future published events appear as upcoming events.
- Older published events can still appear in past event areas.
- Draft events stay inside the admin dashboard.
- Published news posts are shown on the public news pages.
- Published newsletters are available in the newsletter archive.
- Active parish council members are shown on the parish council page.
- Contact forms and registration forms save data into the backend.

## Backend System

The backend is built with Laravel. It handles:

- Login and logout
- Secure sessions
- CSRF protection
- Database storage
- Validation
- File uploads
- Public API routes
- Admin API routes
- Role-based permissions
- Audit logs

The main backend folders are:

```text
backend/app/Http/Controllers
backend/app/Http/Requests
backend/app/Http/Resources
backend/app/Models
backend/database/migrations
backend/routes
backend/storage/app/private
```

## Frontend System

The frontend is built with React and Vite.

The main frontend folders are:

```text
Frontend/src/pages
Frontend/src/pages/admin
Frontend/src/components
Frontend/src/lib
Frontend/src/assets
```

React displays the public website and the admin dashboard. It talks to Laravel using fetch requests through helper files such as:

```text
Frontend/src/lib/auth.js
Frontend/src/lib/admin.js
```

## Admin Dashboard

The admin dashboard lets authorised users manage the website.

Admin pages include:

- Overview dashboard
- Events
- Mass times
- Newsletters
- News posts
- Parish registrations
- Contact messages
- Parish council members
- Groups
- Group members
- Admin accounts
- Profile and password settings

The dashboard uses tables, filters, forms, image uploads, PDF uploads, delete confirmations, and status controls.

## Admin Roles

There are two main admin types.

### Main Admin

The main admin can manage the full website.

The main admin can:

- View the full dashboard
- Create, edit, publish, and delete events
- Manage Mass times
- Manage news posts
- Manage newsletters
- View, edit, and delete parish registrations
- View, update, and delete contact messages
- Manage parish council members
- Manage groups
- Manage group members
- Create, edit, and delete admin accounts
- Assign admins to groups
- View audit logs and recent activity
- Update their own profile and password

### Group Admin

A group admin has limited access. They can only manage content linked to their own group.

A group admin can:

- View their dashboard
- Create events for their assigned group
- Edit group events
- Manage members in their group
- View contact messages assigned to their group
- Update contact message status
- Update their own profile and password

A group admin cannot manage Mass times, newsletters, news posts, parish registrations, parish council members, other groups, or admin accounts.

## Database

The database is created using Laravel migrations.

Important tables include:

```text
users
groups
group_members
events
mass_times
contact_messages
parish_registrations
parish_children
parish_interests
newsletters
news_posts
parish_council_members
audit_logs
sessions
```

The main relationships are:

- A user can belong to one group.
- A group can have many users.
- A group can have many events.
- A group can have many group members.
- A group can have many contact messages.
- A user can create events, group members, news posts, and audit logs.
- A parish registration can have many children.
- A parish registration can have one interest record.

## File Uploads

Uploaded files are stored in private backend storage.

Important upload folders are:

```text
backend/storage/app/private/events
backend/storage/app/private/news
backend/storage/app/private/newsletters
backend/storage/app/private/parish-council-members
```

The database stores file paths. Laravel serves the files through routes. This is better than placing uploads directly in a public folder.

Examples:

- Event images are served through event image routes.
- News images are served through news image routes.
- Newsletter PDFs are served through newsletter view/download routes.
- Parish council photos are served through parish council photo routes.

## Validation

The project uses validation in both frontend and backend.

Frontend validation helps the user fill forms correctly.

Backend validation protects the database even if someone bypasses the frontend.

Validation checks include:

- Required names and emails
- Valid email addresses
- Valid dates and times
- Strong passwords
- Image file types
- PDF file types
- Maximum file sizes
- Event and Mass time clashes
- Group access rules
- Contact message statuses

## Public API Routes

Public JSON API routes use:

```text
/api/v1
```

Examples:

```text
GET  /api/v1/events
GET  /api/v1/events/{id}
GET  /api/v1/mass-times
POST /api/v1/contact
POST /api/v1/parish-registrations
GET  /api/v1/newsletters
GET  /api/v1/news
GET  /api/v1/parish-council-members
GET  /api/v1/groups
```

## Admin Routes

Admin routes use:

```text
/admin
```

Examples:

```text
GET    /admin/overview
GET    /admin/events
POST   /admin/events
PUT    /admin/events/{event}
DELETE /admin/events/{event}
GET    /admin/mass-times
GET    /admin/contact-messages
GET    /admin/groups
GET    /admin/parish-registrations
```

These routes are protected by Laravel authentication. Some routes are only available to the main admin.

## Authentication Routes

React authentication uses:

```text
/auth-api
```

Important routes:

```text
GET  /auth-api/csrf-token
POST /auth-api/login
POST /auth-api/signup
GET  /auth-api/me
POST /auth-api/logout
```

The frontend first requests a CSRF token. Then it sends the login request with the token. This starts a secure Laravel session.

## Audit Logs

The backend stores important admin actions in `audit_logs`.

Audit logs can record actions such as:

- Created event
- Updated event
- Deleted event
- Updated contact message status
- Created group member
- Deleted group member

This helps show recent admin activity.

## Useful Content Rules

- Draft content is not public.
- Published content is public.
- Group admins are limited to their own group.
- Main admins can manage everything.
- Parish council sort order controls the public display order.
- Children close to turning 18 are highlighted for admin review.
- Delete actions use confirmation prompts.

## Local Development

Run the backend from the `backend` folder:

```bash
cd backend
composer install
php artisan migrate
php artisan serve --host=127.0.0.1 --port=8000
```

Run the frontend from the `Frontend` folder:

```bash
cd Frontend
npm install
npm run dev
```

During local development the React app is available at:

```text
http://127.0.0.1:5173
```

The Laravel backend is available at:

```text
http://127.0.0.1:8000
```

Backend `/login`, `/register`, and `/dashboard` browser routes redirect to the React app so users see the designed frontend screens.

## Useful Checks

Run backend tests:

```bash
cd backend
php artisan test
```

Run frontend checks:

```bash
cd Frontend
npm run lint
npm run build
```

Check one PHP file for syntax errors:

```bash
php -l backend/app/Http/Controllers/Admin/OverviewController.php
```

## Summary

This project connects a React public website with a Laravel backend and admin dashboard. The cathedral can manage events, Mass times, news, newsletters, parish council members, registrations, contact messages, groups, and admin users from one system. The backend stores data securely, validates form input, manages uploaded files, and sends clean API data to the frontend.
