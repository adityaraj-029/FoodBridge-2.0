import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signupUser } from '../services/api';
import { useAuth } from '../context/useAuth';
import api from '../services/api';

function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'donor',
    address: '',
    password: '',
  });

  const [ngoData, setNgoData] = useState({
    organizationName: '',
    capacity: '',
    latitude: '',
    longitude: '',
    registrationNumber: '',
    ngoDarpanId: '',
    documentData: '',
    documentMimeType: '',
    documentName: '',
  });

  const [volunteerData, setVolunteerData] = useState({
    idProofData: '',
    idProofMimeType: '',
    idProofName: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle normal form fields
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleVolunteerDocumentChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a volunteer ID proof as PDF, JPG, PNG or WEBP.');
      event.target.value = '';
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setError('Volunteer ID proof must be smaller than 4 MB.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setVolunteerData({
        idProofData: reader.result,
        idProofMimeType: file.type,
        idProofName: file.name,
      });
      setError('');
    };
    reader.onerror = () => setError('Could not read the selected ID proof.');
    reader.readAsDataURL(file);
  };

  // Handle NGO fields
  const handleNgoChange = (e) => {
    setNgoData({
      ...ngoData,
      [e.target.name]: e.target.value,
    });
  };

  const handleDocumentChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PDF, JPG, PNG or WEBP file.');
      event.target.value = '';
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setError('Please upload a document smaller than 4 MB.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setNgoData((prev) => ({
        ...prev,
        documentData: reader.result,
        documentMimeType: file.type,
        documentName: file.name,
      }));
      setError('');
    };
    reader.onerror = () => setError('Could not read the selected document.');
    reader.readAsDataURL(file);
  };

  // Get current location and fill the address automatically.
  const useLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setError('Finding your current address...');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude.toFixed(6);
        const longitude = position.coords.longitude.toFixed(6);

        setNgoData((prev) => ({
          ...prev,
          latitude,
          longitude,
        }));

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}&zoom=18&addressdetails=1`
          );
          const data = await response.json();
          const address = data?.display_name || '';

          setFormData((prev) => ({
            ...prev,
            address: address || prev.address,
          }));
          setError(address ? '' : 'Location found. Please check or enter the address manually.');
        } catch {
          setError('Location found, but address lookup failed. Please enter the address manually.');
        }
      },
      () => {
        setError('Unable to get your location. Please allow location permission.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Submit signup form
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setLoading(true);

    // Basic validation
    if (
      !formData.name ||
      !formData.email ||
      !formData.phone ||
      !formData.password
    ) {
      setError('Please fill all required fields.');
      setLoading(false);
      return;
    }

    // NGO validation
    if (
      formData.role === 'ngo' &&
      (!ngoData.organizationName ||
        !ngoData.capacity ||
        !ngoData.registrationNumber ||
        !ngoData.ngoDarpanId ||
        !ngoData.documentData)
    ) {
      setError('Please fill NGO details and provide registration proof.');
      setLoading(false);
      return;
    }

    if (formData.role === 'volunteer' && !volunteerData.idProofData) {
      setError('Please upload your volunteer ID proof.');
      setLoading(false);
      return;
    }

    try {
      // Create Firebase account
      const userCredential = await signup(
        formData.email,
        formData.password
      );

      const firebaseUID = userCredential.user.uid;

      // Create backend user
      const res = await signupUser({
        ...formData,
        firebaseUID,
        idProofData: formData.role === 'volunteer' ? volunteerData.idProofData : '',
        idProofMimeType: formData.role === 'volunteer' ? volunteerData.idProofMimeType : '',
        idProofName: formData.role === 'volunteer' ? volunteerData.idProofName : '',
      });

      const token = res.data.token;

      // Save authentication information
      localStorage.setItem('token', token);

      localStorage.setItem(
        'userInfo',
        JSON.stringify(res.data.user)
      );

      // =====================================================
      // NGO ORGANIZATION CREATION
      // =====================================================

      if (formData.role === 'ngo') {
        await api.post(
          '/ngos',
          {
            organizationName: ngoData.organizationName,

            capacity: parseInt(
              ngoData.capacity,
              10
            ),

            registrationNumber: ngoData.registrationNumber,
            ngoDarpanId: ngoData.ngoDarpanId,
            documentData: ngoData.documentData,
            documentMimeType: ngoData.documentMimeType,
            documentName: ngoData.documentName,
            location: {
              address: formData.address,

              latitude:
                parseFloat(ngoData.latitude) || 0,

              longitude:
                parseFloat(ngoData.longitude) || 0,
            },
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      // =====================================================
      // ROLE-BASED REDIRECT
      // =====================================================

      const role = res.data.user.role;

      if (role === 'donor') {
        navigate('/donor-dashboard');
      } else if (role === 'ngo') {
        navigate('/ngo-dashboard');
      } else if (role === 'volunteer') {
        navigate('/volunteer-dashboard');
      } else {
        navigate('/');
      }

    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Signup failed'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-10 px-4">

      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-md w-full max-w-md"
      >

        {/* =================================================
            TITLE
        ================================================= */}

        <h2 className="text-2xl font-bold mb-2 text-green-700">
          Sign Up - FoodBridge
        </h2>

        <p className="text-sm text-gray-500 mb-6">
          Create your FoodBridge account
        </p>


        {/* =================================================
            ERROR MESSAGE
        ================================================= */}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-5 text-sm">
            {error}
          </div>
        )}


        {/* =================================================
            NAME
        ================================================= */}

        <label className="block text-sm font-medium text-gray-700 mb-1">
          Full Name
        </label>

        <input
          type="text"
          name="name"
          placeholder="Enter your full name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 p-3 mb-4 rounded-lg outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />


        {/* =================================================
            EMAIL
        ================================================= */}

        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>

        <input
          type="email"
          name="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 p-3 mb-4 rounded-lg outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />


        {/* =================================================
            PASSWORD
        ================================================= */}

        <label className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>

        <input
          type="password"
          name="password"
          placeholder="Create a password"
          value={formData.password}
          onChange={handleChange}
          required
          minLength={6}
          className="w-full border border-gray-300 p-3 mb-4 rounded-lg outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />


        {/* =================================================
            PHONE
        ================================================= */}

        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number
        </label>

        <input
          type="tel"
          name="phone"
          placeholder="Enter phone number"
          value={formData.phone}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 p-3 mb-4 rounded-lg outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />


        {/* =================================================
            ROLE
        ================================================= */}

        <label className="block text-sm font-medium text-gray-700 mb-1">
          Account Type
        </label>

        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="w-full border border-gray-300 p-3 mb-4 rounded-lg outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
        >
          <option value="donor">
            Donor
          </option>

          <option value="ngo">
            NGO
          </option>

          <option value="volunteer">
            Volunteer
          </option>
        </select>


        {/* =================================================
            ADDRESS
        ================================================= */}

        <label className="block text-sm font-medium text-gray-700 mb-1">
          Address
        </label>

        <input
          type="text"
          name="address"
          placeholder="Enter your address"
          value={formData.address}
          onChange={handleChange}
          className="w-full border border-gray-300 p-3 mb-4 rounded-lg outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />


        {/* =================================================
            NGO DETAILS
        ================================================= */}

        {formData.role === 'ngo' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-5">

            <h3 className="text-base font-bold text-green-800 mb-1">
              NGO Organization Details
            </h3>

            <p className="text-xs text-green-700 mb-4">
              Provide your organization's details and verification proof.
            </p>


            {/* ORGANIZATION NAME */}

            <label className="block text-sm font-medium text-green-900 mb-1">
              Organization Name
            </label>

            <input
              type="text"
              name="organizationName"
              placeholder="Enter organization name"
              value={ngoData.organizationName}
              onChange={handleNgoChange}
              required={formData.role === 'ngo'}
              className="w-full border border-green-200 bg-white p-3 mb-3 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
            />


            {/* CAPACITY */}

            <label className="block text-sm font-medium text-green-900 mb-1">
              Capacity
            </label>

            <input
              type="number"
              name="capacity"
              placeholder="Maximum people you can feed"
              value={ngoData.capacity}
              onChange={handleNgoChange}
              min="1"
              required={formData.role === 'ngo'}
              className="w-full border border-green-200 bg-white p-3 mb-3 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
            />


            <label className="block text-sm font-medium text-green-900 mb-1">
              Registration Number
            </label>

            <input
              type="text"
              name="registrationNumber"
              placeholder="NGO registration number"
              value={ngoData.registrationNumber}
              onChange={handleNgoChange}
              required={formData.role === 'ngo'}
              className="w-full border border-green-200 bg-white p-3 mb-3 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
            />

            <label className="block text-sm font-medium text-green-900 mb-1">
              NGO DARPAN ID <span className="text-red-600">*</span>
            </label>

            <input
              type="text"
              name="ngoDarpanId"
              placeholder="Enter NGO DARPAN ID"
              value={ngoData.ngoDarpanId}
              onChange={handleNgoChange}
              className="w-full border border-green-200 bg-white p-3 mb-3 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
            />

            <label className="block text-sm font-medium text-green-900 mb-1">
              Registration Document <span className="text-red-600">*</span>
            </label>

            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
              onChange={handleDocumentChange}
              required={formData.role === 'ngo'}
              className="w-full border border-green-200 bg-white p-3 mb-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
            />

            <p className="text-xs text-green-700 mb-3">
              Upload a PDF or image from your device. Maximum size: 4 MB.
            </p>

            <label className="block text-sm font-medium text-green-900 mb-1">
              Document Name <span className="font-normal text-gray-500">(optional)</span>
            </label>

            <input
              type="text"
              name="documentName"
              placeholder="Selected file name"
              value={ngoData.documentName}
              readOnly
              onChange={handleNgoChange}
              className="w-full border border-green-200 bg-white p-3 mb-4 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
            />

            {/* LOCATION BUTTON */}

            <button
              type="button"
              onClick={useLocation}
              className="w-full bg-blue-100 text-blue-700 py-3 rounded-lg mb-3 hover:bg-blue-200 transition text-sm font-medium"
            >
              📍 Use My Current Location
            </button>


            {/* COORDINATES */}

            <div className="flex gap-2">

              <div className="w-1/2">

                <label className="block text-xs text-green-800 mb-1">
                  Latitude
                </label>

                <input
                  type="text"
                  name="latitude"
                  placeholder="Latitude"
                  value={ngoData.latitude}
                  onChange={handleNgoChange}
                  className="w-full border border-green-200 bg-white p-2.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                />

              </div>


              <div className="w-1/2">

                <label className="block text-xs text-green-800 mb-1">
                  Longitude
                </label>

                <input
                  type="text"
                  name="longitude"
                  placeholder="Longitude"
                  value={ngoData.longitude}
                  onChange={handleNgoChange}
                  className="w-full border border-green-200 bg-white p-2.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                />

              </div>

            </div>


            {/* APPROVAL MESSAGE */}

            <div className="mt-4 bg-white border border-green-200 rounded-lg p-3">

              <p className="text-xs text-green-700 leading-relaxed">
                <strong>Note:</strong> Your organization will need
                admin approval before you can accept donations.
              </p>

            </div>

          </div>
        )}


        {formData.role === 'volunteer' && (
          <div className="mb-5 rounded-xl border border-purple-200 bg-purple-50 p-5">
            <h3 className="mb-1 text-base font-bold text-purple-900">Volunteer Verification</h3>
            <p className="mb-4 text-xs text-purple-700">Upload an ID proof so the admin can verify volunteers before assigning food pickups.</p>
            <label className="mb-1 block text-sm font-medium text-purple-900">
              ID Proof <span className="text-red-600">*</span>
            </label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
              onChange={handleVolunteerDocumentChange}
              required={formData.role === 'volunteer'}
              className="w-full rounded-lg border border-purple-200 bg-white p-3 text-sm"
            />
            <p className="mt-2 text-xs text-purple-700">PDF or image, maximum 4 MB.</p>
            {volunteerData.idProofName && (
              <p className="mt-2 text-sm font-semibold text-purple-800">Selected: {volunteerData.idProofName}</p>
            )}
            <div className="mt-3 rounded-lg bg-white p-3 text-xs text-purple-800">
              You can receive pickup tasks after admin verification.
            </div>
          </div>
        )}

        {/* =================================================
            SIGN UP BUTTON
        ================================================= */}

        <button
          type="submit"
          disabled={loading}
          className={`w-full text-white py-3 rounded-lg font-semibold transition ${
            loading
              ? 'bg-green-400 cursor-not-allowed'
              : 'bg-green-700 hover:bg-green-800'
          }`}
        >
          {loading
            ? 'Creating Account...'
            : 'Create Account'}
        </button>


        {/* =================================================
            LOGIN LINK
        ================================================= */}

        <p className="text-center text-sm text-gray-500 mt-5">

          Already have an account?{' '}

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-green-700 font-semibold hover:text-green-800"
          >
            Login
          </button>

        </p>

      </form>

    </div>
  );
}

export default Signup;
