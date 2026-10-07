import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../services/api';
import DashboardLayout from '../components/DashboardLayout';

const navItems = [
  { path: '/volunteer-dashboard', label: 'My Tasks', icon: '🚚' },
  { path: '/scan', label: 'Scan QR', icon: '▣' },
];

function QRScanner() {
  const scannerRef = useRef(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const donationIdFromUrl = new URLSearchParams(window.location.search).get('donationId') || '';

  const [result, setResult] = useState('');
  const [donationId, setDonationId] = useState(donationIdFromUrl);
  const [qrToken, setQrToken] = useState('');
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [success, setSuccess] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const verifyPickup = async () => {
    if (!donationId) {
      setMessage('Scan the donor QR code first.');
      return;
    }

    if (!qrToken && otp.length !== 6) {
      setMessage('Scan the QR or enter the 6-digit OTP.');
      return;
    }

    setVerifying(true);
    setMessage('');

    try {
      const body = qrToken ? { qrToken } : { otp };
      const response = await api.put(
        `/donations/${donationId}/verify-pickup`,
        body,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(response.data.message || 'Pickup verified successfully.');
      setSuccess(true);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Verification failed.');
      setSuccess(false);
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const scanner = new Html5Qrcode('qr-reader');
    scannerRef.current = scanner;

    const stopScanner = () => {
      try {
        const stopResult = scanner.stop();
        if (stopResult && typeof stopResult.catch === 'function') {
          stopResult.catch(() => {});
        }
      } catch {
        // The scanner may already be stopped after a successful scan.
      }
    };

    const handleScan = (decodedText) => {
      if (cancelled) return;
      setResult(decodedText);
      stopScanner();

      try {
        const scanned = JSON.parse(decodedText);
        setDonationId(scanned.donationId || scanned.id || '');
        setQrToken(scanned.qrToken || '');
        if (scanned.otp) {
          setOtp(String(scanned.otp).replace(/\D/g, '').slice(0, 6));
        }
        setMessage(
          scanned.qrToken
            ? 'QR scanned successfully. Press Confirm with QR.'
            : 'QR scanned. Enter the donor OTP to continue.'
        );
      } catch {
        setDonationId(decodedText.trim());
        setQrToken('');
        setMessage('QR scanned. Enter the donor OTP to continue.');
      }
    };

    const startCamera = async () => {
      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          handleScan,
          () => {}
        );
      } catch (error) {
        console.error('QR Scanner error:', error);
        if (!cancelled) {
          setCameraError(
            'Camera could not start. Allow camera permission or use the OTP option from My Tasks.'
          );
        }
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      stopScanner();
      try {
        const clearResult = scanner.clear();
        if (clearResult && typeof clearResult.catch === 'function') {
          clearResult.catch(() => {});
        }
      } catch {
        // The scanner element may already be cleared.
      }
    };
  }, []);

  return (
    <DashboardLayout navItems={navItems}>
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-green-700">
            <span className="h-2 w-2 rounded-full bg-green-600" />
            Quick pickup confirmation
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Scan donor QR
          </h1>
          <p className="mt-2 text-gray-500">
            Use the small scanner box below. QR or OTP—either method confirms pickup.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
          {!result && (
            <div className="flex flex-col items-center">
              <div className="relative rounded-2xl border-2 border-green-500 bg-gray-950 p-3 shadow-lg">
                <div id="qr-reader" className="h-[260px] w-[260px] overflow-hidden rounded-xl" />
                <span className="pointer-events-none absolute left-7 top-7 h-8 w-8 border-l-4 border-t-4 border-green-300" />
                <span className="pointer-events-none absolute right-7 top-7 h-8 w-8 border-r-4 border-t-4 border-green-300" />
                <span className="pointer-events-none absolute bottom-7 left-7 h-8 w-8 border-b-4 border-l-4 border-green-300" />
                <span className="pointer-events-none absolute bottom-7 right-7 h-8 w-8 border-b-4 border-r-4 border-green-300" />
              </div>
              <p className="mt-4 text-center text-sm font-semibold text-gray-600">
                Place the donor QR inside the square
              </p>
            </div>
          )}

          {cameraError && (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
              {cameraError}
            </div>
          )}

          {result && (
            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                <p className="text-sm font-bold text-green-900">QR scanned successfully</p>
                <p className="mt-1 break-all font-mono text-xs text-green-800">{result}</p>
              </div>

              {!qrToken && (
                <div>
                  <label htmlFor="pickup-otp" className="mb-2 block text-sm font-bold text-gray-800">
                    Donor OTP
                  </label>
                  <input
                    id="pickup-otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit OTP"
                    className="min-h-11 w-full rounded-xl border border-gray-300 px-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
                  />
                </div>
              )}

              {qrToken && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-800">
                  ✓ QR contains a valid pickup token. No OTP is needed.
                </div>
              )}

              {message && (
                <p className={`text-sm font-semibold ${success ? 'text-green-700' : 'text-red-600'}`}>
                  {message}
                </p>
              )}

              {!success ? (
                <button
                  type="button"
                  onClick={verifyPickup}
                  disabled={verifying}
                  className="min-h-11 w-full rounded-xl bg-green-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-green-300"
                >
                  {verifying ? 'Confirming pickup...' : qrToken ? 'Confirm with QR' : 'Confirm with OTP'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/volunteer-dashboard')}
                  className="min-h-11 w-full rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-800"
                >
                  Go to My Tasks
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default QRScanner;
