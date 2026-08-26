# Food Rush ---> Food Dilivery System

FoodRush is a modern online food delivery platform built using the MERN stack.
This repository contains the **backend API** of FoodRush, developed using Node.js, Express.js, and MongoDB.

The backend provides REST APIs for Customers, Restaurant Owners, and Administrators.

---

## 🚀 Live API

Backend API: https://be-fds.onrender.com

Frontend: [https://foodrush-fds.netlify.app/](https://foodrush-fds.netlify.app/)

---

## 📌 Features

### 👤 Customer

- User registration
- User login
- Email verification
- JWT authentication
- Profile management
- Profile image upload
- Update personal information
- Browse approved restaurants
- Search restaurants
- Filter restaurants
- View restaurant details
- Browse restaurant menus
- Favorite restaurants
- Favorite food items
- Cart management
- Add items to cart
- Update cart quantities
- Remove cart items
- Place orders
- Razorpay payment integration
- Payment verification
- Order history
- Order tracking
- Scheduled delivery
- Customer reviews and ratings
- Restaurant rating
- Delivery rating
- View restaurant responses

---

### 🏪 Restaurant Owner

- Restaurant registration/application
- Restaurant profile management
- Restaurant logo upload
- Restaurant banner upload
- Restaurant description
- Opening hours management
- Menu management
- Add menu items
- Update menu items
- Delete menu items
- Menu image upload
- View restaurant orders
- Update order status
- View customer reviews
- Respond to customer reviews
- Update review responses
- View restaurant ratings

---

### 👨‍💼 Admin

- Admin authentication
- Admin dashboard data
- Restaurant application management
- Approve restaurants
- Reject restaurants
- View all restaurants
- Manage restaurant status
- View customer reviews
- Review moderation
- Approve reviews
- Reject inappropriate reviews
- Add moderation notes
- View review statistics
- Monitor customer feedback

---

## ⭐ Reviews & Ratings

FoodRush provides a complete review and rating system.

Customers can submit:

- Restaurant rating
- Delivery rating
- Written feedback

Restaurant owners can:

- View reviews
- Respond to reviews
- Update their responses

Administrators can:

- View all reviews
- Approve reviews
- Reject inappropriate reviews
- Add moderation notes

---

## 💳 Payment Integration

FoodRush uses **Razorpay** for secure online payment processing.

The backend handles:

- Razorpay order creation
- Payment verification
- Payment status management
- Order and payment relationship
- Successful payment handling
- Failed payment handling

> Razorpay test mode is used during development and testing.

---

## 🔐 Authentication & Authorization

The backend uses JWT-based authentication and role-based authorization.

Supported roles:

- Customer
- Restaurant Owner
- Admin

Protected APIs are accessible only to authenticated users with the required role.

---

## 🛡️ Middleware

The backend uses middleware for:

- Authentication
- Role-based authorization
- Restaurant approval verification
- File uploads
- Image validation
- Request validation

---

## 📁 Project Structure

```text
├── controllers/
├── middleware/
├── models/
├── routes/
├── services/
├── uploads/
│   ├── users/
│   ├── logos/
│   ├── banners/
│   └── menus/
├── utils/
├── app.js
├── server.js
├── package.json
└── README.md
```

## 🔑 Demo Credentials

### 👤 Customer

Email: karan@example.com  
Password: 123456
Email: anshu@example.com  
Password: 123456

### 🏪 Restaurant Owner

Email: khanna@example.com  
Password: 123456
Email: sonam@example.com  
Password: 123456

### 👨‍💼 Admin

Email: raj@example.com  
Password: 123456

### ⚙️ Installation & Setup

```bash
git clone https://github.com/Rkthak/BE-FDS.git
cd BE-FDS
npm install

npm run dev

```

## 👨‍💻 Developer

**Raj Kumar**

FoodRush — Food Delivery System

Built using the MERN Stack.
