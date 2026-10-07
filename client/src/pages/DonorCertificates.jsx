import { useEffect, useState } from "react";
import api from "../services/api";
import DashboardLayout from "../components/DashboardLayout";

const navItems = [
  { path: "/donor-dashboard", label: "List Food", icon: "📝" },
  { path: "/my-donations", label: "Your Donations", icon: "📦" },
  { path: "/donor-profile", label: "Profile", icon: "👤" },
  { path: "/donor-certificates", label: "Certificates", icon: "🏆" },
];

const API_BASE_URL = (
  api.defaults.baseURL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api"
).replace(/\/$/, "");

function DonorCertificates() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const res = await api.get("/donations/my-donations", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const deliveredDonations = res.data.filter(
          (donation) => donation.status === "delivered",
        );
        setDonations(deliveredDonations);
      } catch (error) {
        console.error("Failed to fetch certificates:", error);
        setDonations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, [token]);

  if (loading) {
    return (
      <DashboardLayout navItems={navItems}>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-green-200 border-t-green-600" />
            <p className="font-medium text-gray-500">Loading certificates...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems}>
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-600" />
          <span className="text-sm font-bold uppercase tracking-wider text-green-700">
            Recognition
          </span>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
              Your Certificates
            </h1>
            <p className="mt-2 text-gray-500">
              Certificates earned for your successfully completed donations.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white px-5 py-3 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-400">
              Certificates Earned
            </p>
            <p className="text-2xl font-extrabold text-green-700">
              {donations.length}
            </p>
          </div>
        </div>
      </div>

      {donations.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 text-3xl">
            🏆
          </div>
          <h2 className="mb-2 text-xl font-bold text-gray-900">
            No certificates yet
          </h2>
          <p className="mx-auto max-w-md text-gray-500">
            Complete a food donation successfully to earn your FoodBridge
            certificate.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {donations.map((donation) => {
            const foodNames =
              donation.foodItems?.map((item) => item.name).join(", ") ||
              "Food Donation";

            const deliveredDate = donation.deliveredAt
              ? new Date(donation.deliveredAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "Date not available";

            const certificateUrl =
              `${API_BASE_URL}/donations/${donation._id}/certificate/donor` +
              `?token=${encodeURIComponent(token || "")}`;

            return (
              <div
                key={donation._id}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 p-6 text-white shadow-lg"
              >
                <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-white/5 blur-2xl" />

                <div className="relative z-10">
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-3xl">
                    🏆
                  </div>

                  <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-green-100">
                    FoodBridge Certificate
                  </div>

                  <h3 className="mb-2 text-2xl font-extrabold">{foodNames}</h3>

                  <p className="mb-5 text-sm text-green-100">
                    Your donation was successfully delivered to the community.
                  </p>

                  <div className="mb-6 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-white/10 bg-white/10 p-3">
                      <p className="text-xs text-green-100">Status</p>
                      <p className="mt-1 font-bold">✓ Delivered</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/10 p-3">
                      <p className="text-xs text-green-100">Delivered On</p>
                      <p className="mt-1 text-sm font-bold">{deliveredDate}</p>
                    </div>
                  </div>

                  <a
                    href={certificateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-green-800 shadow-sm transition hover:bg-green-50"
                  >
                    📄 View Certificate
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}

export default DonorCertificates;
