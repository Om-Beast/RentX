import { motion } from "framer-motion";

export default function Footer() {
  const quickLinks = [
    { name: "Home", href: "/" },
    { name: "About", href: "#" },
    { name: "Features", href: "#" },
    { name: "Pricing", href: "#" },
    { name: "Contact", href: "#" },
  ];

  const vehicleCategories = [
    { name: "Scooters", href: "#" },
    { name: "Bikes", href: "#" },
    { name: "Cars", href: "#" },
    { name: "SUVs", href: "#" },
    { name: "EVs", href: "#" },
    { name: "Luxury", href: "#" },
  ];

  const supportLinks = [
    { name: "Help Center", href: "#" },
    { name: "FAQ", href: "#" },
    { name: "Terms of Service", href: "#" },
    { name: "Privacy Policy", href: "#" },
  ];

  return (
    <footer className="bg-white border-t border-gray-200">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <h2 className="text-3xl font-bold text-indigo-600 mb-4">
              RentX
            </h2>

            <p className="text-gray-600 text-sm">
              India's smart vehicle rental platform for scooters,
              bikes, cars, SUVs and premium rides.
            </p>

            <p className="mt-4 text-sm text-gray-500">
              Follow RentX for latest updates.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              Quick Links
            </h3>

            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-sm text-gray-600 hover:text-indigo-600"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Vehicles */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              Vehicles
            </h3>

            <ul className="space-y-2">
              {vehicleCategories.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className="text-sm text-gray-600 hover:text-indigo-600"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              Support
            </h3>

            <ul className="space-y-2">
              {supportLinks.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className="text-sm text-gray-600 hover:text-indigo-600"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              Stay Updated
            </h3>

            <p className="text-sm text-gray-600 mb-3">
              Get latest offers and vehicle updates.
            </p>

            <form className="flex flex-col gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <button
                type="button"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </motion.div>

      <div className="border-t border-gray-200 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} RentX. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}