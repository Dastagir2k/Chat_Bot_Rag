import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const validateForm = () => {
    let formErrors = {};
    let isValid = true;

    // Validate Name
    if (!formData.name.trim()) {
      formErrors.name = "Name is required";
      isValid = false;
    }

    // Validate Email
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      formErrors.email = "Email is required";
      isValid = false;
    } else if (!emailPattern.test(formData.email)) {
      formErrors.email = "Please enter a valid email";
      isValid = false;
    }

    setErrors(formErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return; // Stop submission if form is invalid
    }

    try {
      const response = await axios.post("http://localhost:8000/signup", formData);
      console.log("User signed up successfully", response.data.data.id);
      localStorage.setItem("user_id", response.data.data.id); // Store user ID in local storage
      navigate("/chat");
    } catch (error) {
      if (error.response && error.response.data && error.response.data.check === "falseP") {
        console.log("Error during sign-up:", error.response.data.message);
        alert("Incorrect Password");
      } else {
        console.error("Error during sign-up:", error);
        alert("An error occurred. Please try again.");
      }
    }
  };

  return (
    <div className="text-white bg-gray-900 ">
      <h1 className="text-3xl text-center">Weclome To GenChat</h1>
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-md">
      
        <h2 className="text-3xl font-bold text-white mb-8 text-center">
          Sign Up
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              className="block text-white text-lg font-medium mb-2"
              htmlFor="name"
            >
              Name
            </label>
            <input
              className="appearance-none border rounded w-full py-3 px-4 text-white focus:ring-2 focus:ring-gray-500 transition duration-300"
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your name"
            />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name}</p>
            )}
          </div>

          <div className="mb-4">
            <label
              className="block text-white text-lg font-medium mb-2"
              htmlFor="email"
            >
              Email
            </label>
            <input
              className="appearance-none border rounded w-full py-3 px-4 text-white focus:ring-2 focus:ring-gray-500 transition duration-300"
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email}</p>
            )}
          </div>
          <div className="mb-4">
            <label
              className="block text-white text-lg font-medium mb-2"
              htmlFor="password"
            >
              Password
            </label>
            <input
              className="appearance-none border rounded w-full py-3 px-4 text-white focus:ring-2 focus:ring-gray-500 transition duration-300"
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
            />
            {errors.password && (
              <p className="text-red-500 text-sm">{errors.password}</p>
            )}
          </div>

          <div className="flex items-center justify-center">
            <button
              className="border border-gray-300 hover:cursor-pointer font-medium text-white py-3 px-6 rounded-full w-full transition-transform duration-200 hover:scale-105"
              type="submit"
            >
              Sign Up
            </button>
          </div>
        </form>
      </div>
    </div>
    </div>
  );
};

export default Signup;
