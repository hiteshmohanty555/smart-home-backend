function normalizePhone(req, res, next) {
  if (req.body.phone) {
    let phone = req.body.phone.trim();

    // Remove all non-digit characters except leading '+'
    phone = phone.replace(/(?!^\+)\D/g, '');

    // Remove duplicate country codes if present (e.g., '+91+91...')
    const countryCodeMatch = phone.match(/^(\+\d{1,3})/);
    if (countryCodeMatch) {
      const countryCode = countryCodeMatch[1];
      const escapedCountryCode = countryCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      phone = phone.replace(new RegExp(`^(${escapedCountryCode})+`), countryCode);
    }

    // Ensure phone starts with '+'
    if (!phone.startsWith("+")) {
      phone = "+" + phone;
    }

    req.body.phone = phone;
  }
  next();
}

module.exports = normalizePhone;
