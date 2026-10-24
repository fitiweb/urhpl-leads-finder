// Safe for browser use ONLY with Supabase publishable/anon key.
// Never add SUPABASE_SERVICE_ROLE_KEY, Google Places key or Hunter key here.
window.FITIWEBS_CONFIG = {
  supabaseUrl: "https://pjckvvuybwtibztjnqpf.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqY2t2dnV5Ynd0aWJ6dGpucXBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4NTQwMjQsImV4cCI6MjEwODQzMDAyNH0.lqbzylwqT9vXpC2F8pKLRxhEktE3O-tONhNUVKmgj8A",
  
  // Fix for "Free geocoding service is temporarily unavailable"
  nominatim: {
    userAgent: "fitiwebst/1.0 (contact@fitiwebst.com)",
    delayMs: 1300, // OSM requires 1+ sec between requests
    email: "contact@fitiwebst.com" // for Nominatim identification
  },

  // Fix for "leads_email_verified_check" violation
  leads: {
    // Change from 'not verified' to value your DB allows
    defaultVerificationStatus: "pending",
    allowedStatuses: ["pending", "verified", "not_verified"],
    // Ensure email is saved as pending first, not 'not verified'
    normalizeStatus: function(status) {
      if (status === "not verified") return "pending";
      return status;
    }
  }
};

// Helper to ensure Vercel envs match frontend config
if (typeof window !== 'undefined') {
  window.SUPABASE_URL = window.FITIWEBS_CONFIG.supabaseUrl;
  window.SUPABASE_ANON_KEY = window.FITIWEBS_CONFIG.supabaseAnonKey;
}
