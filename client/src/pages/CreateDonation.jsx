import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createDonation } from '../services/api';

function CreateDonation() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    donorType: 'household',
    donorTypeOther: '',
    organizationName: '',
    cookedTime: '',
    expiryTime: '',
    alternatePhone: '',
    address: '',
    latitude: '',
    longitude: '',
    termsAccepted: false,
  });
  const [foodItems, setFoodItems] = useState([{ name: '', quantity: '' }]);
  const [idProofImage, setIdProofImage] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleFoodItemChange = (index, field, value) => {
    const updated = [...foodItems];
    updated[index][field] = value;
    setFoodItems(updated);
  };

  const addFoodItem = () => {
    setFoodItems([...foodItems, { name: '', quantity: '' }]);
  };

  const removeFoodItem = (index) => {
    if (foodItems.length === 1) return;
    setFoodItems(foodItems.filter((_, i) => i !== index));
  };

  const handleIdProofUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setIdProofImage(reader.result);
    reader.readAsDataURL(file);
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }
    setError('');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`
          );
          const data = await res.json();
          if (data?.display_name) {
            setFormData((prev) => ({ ...prev, address: data.display_name }));
          }
        } catch {
          // Reverse geocode failed, coordinates still set; address can be typed manually.
        }
      },
      () => setError('Unable to fetch location. Please enter address manually below.')
    );
  };

  const handleAddressSearch = async (query) => {
    setFormData((prev) => ({ ...prev, address: query }));
    if (query.length < 3) {
      setAddressSuggestions([]);
      return;
    }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=5`
      );
      const data = await res.json();
      setAddressSuggestions(data);
    } catch {
      setAddressSuggestions([]);
    }
  };

  const selectAddress = (place) => {
    setFormData((prev) => ({
      ...prev,
      address: place.display_name,
      latitude: parseFloat(place.lat).toFixed(6),
      longitude: parseFloat(place.lon).toFixed(6),
    }));
    setAddressSuggestions([]);
  };

  const donorTypeLabels = {
    household: 'Household (Home-cooked food)',
    restaurant: 'Restaurant / Hotel',
    event_organizer: 'Party / Event Organizer',
    other: 'Other',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to list a donation');
      setLoading(false);
      return;
    }

    if (formData.donorType === 'other' && !formData.donorTypeOther) {
      setError('Please specify the donor type');
      setLoading(false);
      return;
    }

    if (
      (formData.donorType !== 'household' && !formData.organizationName) ||
      !formData.expiryTime ||
      !formData.address
    ) {
      setError('Please fill all required fields');
      setLoading(false);
      return;
    }

    const hasEmptyItem = foodItems.some((item) => !item.name || !item.quantity);
    if (hasEmptyItem) {
      setError('Please fill in all food item names and quantities');
      setLoading(false);
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      setError('Please set a pickup location');
      setLoading(false);
      return;
    }

    if (!idProofImage) {
      setError('Please upload an ID proof for verification');
      setLoading(false);
      return;
    }

    if (!formData.termsAccepted) {
      setError('You must accept the Rules & Regulations to proceed');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        donorType: formData.donorType,
        donorTypeOther: formData.donorTypeOther,
        organizationName: formData.organizationName || 'Household Donor',
        foodItems,
        cookedTime: formData.cookedTime || null,
        expiryTime: formData.expiryTime,
        alternatePhone: formData.alternatePhone,
        pickupLocation: {
          address: formData.address,
          latitude: parseFloat(formData.latitude) || 0,
          longitude: parseFloat(formData.longitude) || 0,
        },
        idProofImage,
        termsAccepted: formData.termsAccepted,
      };

      await createDonation(payload, token);
      navigate('/donor-dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create donation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-2xl mx-auto"
      >
        <h2 className="text-3xl font-bold mb-1 text-gray-900">List Surplus Food</h2>
        <p className="text-gray-500 mb-8">
          Share complete details so we can route your donation quickly and safely.
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm">{error}</div>
        )}

        {/* Section 1: Donor Type */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-green-700 uppercase tracking-wide mb-4">
            1. Who is Donating
          </h3>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {Object.entries(donorTypeLabels).map(([value, label]) => (
              <label
                key={value}
                className={`border rounded-xl p-3 cursor-pointer text-sm font-medium transition ${
                  formData.donorType === value
                    ? 'border-green-600 bg-green-50 text-green-800'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="donorType"
                  value={value}
                  checked={formData.donorType === value}
                  onChange={handleChange}
                  className="hidden"
                />
                {label}
              </label>
            ))}
          </div>

          {formData.donorType === 'other' && (
            <input
              type="text"
              name="donorTypeOther"
              placeholder="Please specify (e.g. Corporate cafeteria, Wedding hall)"
              value={formData.donorTypeOther}
              onChange={handleChange}
              className="w-full border p-3 mb-4 rounded-lg"
            />
          )}

          {formData.donorType !== 'household' && (
            <>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formData.donorType === 'event_organizer'
                  ? 'Organizer / Event Head Name'
                  : 'Business / Organization Name'}
              </label>
              <input
                type="text"
                name="organizationName"
                placeholder="e.g. Spice Garden Restaurant"
                value={formData.organizationName}
                onChange={handleChange}
                className="w-full border p-3 mb-4 rounded-lg"
              />
            </>
          )}

          <label className="block text-sm font-medium text-gray-700 mb-1">
            ID Proof <span className="text-gray-400 font-normal">(Aadhaar/PAN, or FSSAI license for businesses)</span>
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleIdProofUpload}
            className="w-full border p-3 rounded-lg mb-2"
          />
          {idProofImage && (
            <img src={idProofImage} alt="ID proof preview" className="h-24 rounded-lg border object-cover mb-4" />
          )}
        </div>

        {/* Section 2: Food Items */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-green-700 uppercase tracking-wide mb-4">
            2. Food Items
          </h3>

          <div className="space-y-3 mb-3">
            {foodItems.map((item, index) => (
              <div key={index} className="flex gap-2 items-start">
                <input
                  type="text"
                  placeholder="Item name (e.g. Rice, Dal, Sabzi)"
                  value={item.name}
                  onChange={(e) => handleFoodItemChange(index, 'name', e.target.value)}
                  className="flex-1 border p-3 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Quantity (e.g. 5 kg)"
                  value={item.quantity}
                  onChange={(e) => handleFoodItemChange(index, 'quantity', e.target.value)}
                  className="w-32 border p-3 rounded-lg"
                />
                {foodItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFoodItem(index)}
                    className="text-red-500 px-3 py-3 hover:bg-red-50 rounded-lg"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addFoodItem}
            className="text-green-700 text-sm font-medium hover:underline mb-4"
          >
            + Add another item
          </button>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cooked / Prepared At
              </label>
              <input
                type="datetime-local"
                name="cookedTime"
                value={formData.cookedTime}
                onChange={handleChange}
                className="w-full border p-3 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Approx. Expiry Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="expiryTime"
                value={formData.expiryTime}
                onChange={handleChange}
                className="w-full border p-3 rounded-lg"
              />
            </div>
          </div>

          <input
            type="text"
            name="alternatePhone"
            placeholder="Alternate Phone Number (optional)"
            value={formData.alternatePhone}
            onChange={handleChange}
            className="w-full border p-3 mb-4 rounded-lg"
          />
        </div>

        {/* Section 3: Pickup Location */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-green-700 uppercase tracking-wide mb-4">
            3. Pickup Location
          </h3>

          <div className="relative mb-4">
            <input
              type="text"
              name="address"
              placeholder="Pickup Address"
              value={formData.address}
              onChange={(e) => handleAddressSearch(e.target.value)}
              className="w-full border p-3 rounded-lg"
            />
            {addressSuggestions.length > 0 && (
              <div className="absolute z-10 bg-white border rounded-lg w-full mt-1 shadow-lg max-h-48 overflow-y-auto">
                {addressSuggestions.map((place, idx) => (
                  <div
                    key={idx}
                    onClick={() => selectAddress(place)}
                    className="p-2 hover:bg-gray-100 cursor-pointer text-sm text-left"
                  >
                    {place.display_name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleUseLocation}
            className="w-full bg-blue-50 text-blue-700 py-2.5 rounded-lg mb-2 hover:bg-blue-100 font-medium"
          >
            📍 Use My Current Location
          </button>

          <p className="text-xs text-gray-500 mb-4">
            Tip: The button above auto-fills both address and coordinates. You
            can also type manually and pick a suggestion, or edit
            latitude/longitude directly below.
          </p>

          <div className="flex gap-2 mb-4">
            <div className="w-1/2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Latitude</label>
              <input
                type="text"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                className="w-full border p-2 rounded-lg text-sm"
              />
            </div>
            <div className="w-1/2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Longitude</label>
              <input
                type="text"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                className="w-full border p-2 rounded-lg text-sm"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Rules & Regulations */}
        <div className="mb-8 bg-orange-50 border-2 border-orange-300 rounded-xl p-6">
          <h3 className="text-base font-bold text-orange-900 uppercase tracking-wide mb-4">
            ⚠️ Rules & Regulations
          </h3>
          <ul className="text-[15px] text-gray-800 space-y-3 mb-5 list-disc list-inside leading-relaxed">
            <li>
              The expiry time provided <strong className="text-orange-800">must be accurate</strong>. Listing food with a false or misleading expiry time is a serious violation.
            </li>
            <li>
              Our volunteer will inspect and <strong className="text-orange-800">may taste-test the food</strong> at pickup. If found spoiled, unsafe, or significantly different from listed, <strong className="text-red-700">strict action will be taken</strong> — including account suspension and reporting to authorities.
            </li>
            <li>Food must be stored hygienically from preparation until pickup.</li>
            <li>The uploaded ID proof will be used <strong className="text-orange-800">only for verification and accountability</strong> purposes.</li>
            <li>Repeated violations will result in a <strong className="text-red-700">permanent ban</strong> from the FoodBridge platform.</li>
          </ul>
          <label className="flex items-start gap-3 text-sm font-medium text-gray-900">
            <input
              type="checkbox"
              name="termsAccepted"
              checked={formData.termsAccepted}
              onChange={handleChange}
              className="mt-1 w-4 h-4"
            />
            I confirm that the information provided is accurate and I agree to the Rules & Regulations above.
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-700 text-white py-3.5 rounded-lg font-semibold hover:bg-green-800 transition"
        >
          {loading ? 'Submitting...' : 'List Food Donation'}
        </button>
      </form>
    </div>
  );
}

export default CreateDonation;
