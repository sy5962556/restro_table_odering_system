import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function RegisterRestaurantPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    // Step 1: Owner Info
    name: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',

    // Step 2: Restaurant Details
    restaurantName: '',
    description: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',

    // Step 3: Operating Settings
    numberOfTables: 10,
    taxRate: 5.0,
    serviceChargeRate: 2.5,
    currency: '₹',
    gstNumber: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const validateStep1 = () => {
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all required owner fields.');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.restaurantName) {
      setError('Restaurant name is required.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        mobile: formData.mobile,
        restaurantName: formData.restaurantName,
        description: formData.description,
        phone: formData.phone || formData.mobile,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          country: formData.country
        },
        numberOfTables: parseInt(formData.numberOfTables) || 5,
        taxRate: parseFloat(formData.taxRate) || 5,
        serviceChargeRate: parseFloat(formData.serviceChargeRate) || 2.5,
        currency: formData.currency,
        gstNumber: formData.gstNumber
      };

      const res = await api.post('/auth/register-restaurant', payload);
      if (res.data.success) {
        localStorage.setItem('pos_token', res.data.token);
        // Automatically login
        await login(formData.email, formData.password);
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please check details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-max-w-md relative z-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-500 to-amber-400 text-3xl shadow-xl shadow-brand-500/20 mb-4">
          🍽️
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">
          Create Your Restaurant Workspace
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Join the Multi-Tenant Smart QR Ordering Platform
        </p>
      </div>

      {/* Step Progress Bar */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl px-4 relative z-10">
        <div className="flex items-center justify-between mb-2 text-xs font-semibold text-slate-400">
          <span className={step >= 1 ? 'text-brand-400' : ''}>1. Owner Account</span>
          <span className={step >= 2 ? 'text-brand-400' : ''}>2. Restaurant Profile</span>
          <span className={step >= 3 ? 'text-brand-400' : ''}>3. Tables & Billing</span>
        </div>
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-amber-400 transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl relative z-10 px-4">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* ─── STEP 1: OWNER ACCOUNT ─── */}
            {step === 1 && (
              <div className="space-y-4 animate-fadeIn">
                <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-2">
                  👤 Owner Account Details
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Vikramaditya Roy"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="owner@restaurant.com"
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Mobile Phone *</label>
                    <input
                      type="tel"
                      name="mobile"
                      required
                      value={formData.mobile}
                      onChange={handleChange}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Password *</label>
                    <input
                      type="password"
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm Password *</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => validateStep1() && setStep(2)}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 hover:to-amber-600 text-white font-bold rounded-xl shadow-lg shadow-brand-500/25 transition-all"
                  >
                    Next: Restaurant Profile →
                  </button>
                </div>
              </div>
            )}

            {/* ─── STEP 2: RESTAURANT PROFILE ─── */}
            {step === 2 && (
              <div className="space-y-4 animate-fadeIn">
                <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-2">
                  🏛️ Restaurant Profile Information
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Restaurant Name *</label>
                  <input
                    type="text"
                    name="restaurantName"
                    required
                    value={formData.restaurantName}
                    onChange={handleChange}
                    placeholder="e.g. Royal Spice Fine Dine"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Short Description / Tagline</label>
                  <textarea
                    name="description"
                    rows={2}
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Authentic Indian & Pan-Asian Delicacies with smart QR table ordering."
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Street Address</label>
                    <input
                      type="text"
                      name="street"
                      value={formData.street}
                      onChange={handleChange}
                      placeholder="100ft Road, Indiranagar"
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Bengaluru"
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-1/3 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={() => validateStep2() && setStep(3)}
                    className="w-2/3 py-3 px-4 bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 hover:to-amber-600 text-white font-bold rounded-xl shadow-lg shadow-brand-500/25"
                  >
                    Next: Tables & Settings →
                  </button>
                </div>
              </div>
            )}

            {/* ─── STEP 3: TABLES & BILLING ─── */}
            {step === 3 && (
              <div className="space-y-4 animate-fadeIn">
                <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-2">
                  🪑 Initial Setup & Taxes
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Dining Tables</label>
                    <input
                      type="number"
                      name="numberOfTables"
                      min="1"
                      max="50"
                      value={formData.numberOfTables}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-brand-500"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">We will generate QR codes for each table.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">GST / Tax Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      name="taxRate"
                      value={formData.taxRate}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Service Charge (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      name="serviceChargeRate"
                      value={formData.serviceChargeRate}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">GSTIN Number (Optional)</label>
                    <input
                      type="text"
                      name="gstNumber"
                      value={formData.gstNumber}
                      onChange={handleChange}
                      placeholder="29ABCDE1234F1Z5"
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-1/3 py-3.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-2/3 py-3.5 px-4 bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 hover:to-amber-600 text-white font-bold rounded-xl shadow-xl shadow-brand-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? 'Creating Workspace…' : '🚀 REGISTER RESTAURANT'}
                  </button>
                </div>
              </div>
            )}

          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            Already have a restaurant account?{' '}
            <Link to="/admin/login" className="font-semibold text-brand-400 hover:text-brand-300 underline">
              Log in here
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
