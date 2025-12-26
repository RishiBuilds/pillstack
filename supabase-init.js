(function() {
    const CONFIG = {
        URL: 'https://ohwesuhgqezpqkhugdnu.supabase.co',
        KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9od2VzdWhncWV6cHFraHVnZG51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NTEyOTEsImV4cCI6MjA4MjIyNzI5MX0.W28NBgAOyPVpLLTRfjG8yHC7C3qLHFa6ji-jHf10fhQ'
    };

    function initSupabaseClient() {
        // Basically it Check's if Supabase library is loaded
        if (!window.supabase) {
            return false;
        }

        // Initializes client if not already initialized
        if (!window.supabaseClient) {
            try {
                window.supabaseClient = window.supabase.createClient(CONFIG.URL, CONFIG.KEY);
                console.log("Supabase Client initialized successfully.");
                return true;
            } catch (error) {
                console.error("Error initializing Supabase client:", error);
                return false;
            }
        }
        return true;
    }

    // Tries to initialize immediately if Supabase is already loaded
    if (initSupabaseClient()) {
        return;
    }

    // Wait's for window load event
    if (document.readyState === 'loading') {
        window.addEventListener('load', function() {
            initSupabaseClient();
        });
    } else {
        // DOM is already loaded, try initialization
        initSupabaseClient();
    }

    // Polling mechanism 
    let attempts = 0;
    const maxAttempts = 20; 
    const pollInterval = 500; 

    const interval = setInterval(function() {
        attempts++;
        
        if (initSupabaseClient()) {
            clearInterval(interval);
            return;
        }
        
        if (attempts >= maxAttempts) {
            clearInterval(interval);
            console.error("Supabase CDN not loaded after " + (maxAttempts * pollInterval / 1000) + " seconds.");
            console.warn("Please check:");
            console.warn("1. Internet connection");
            console.warn("2. Script tag order (Supabase CDN should load before supabase-init.js)");
            console.warn("3. CDN URL: https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2");
            
            // Tries one more time after a delay
            setTimeout(function() {
                if (!window.supabaseClient && window.supabase) {
                    try {
                        window.supabaseClient = window.supabase.createClient(CONFIG.URL, CONFIG.KEY);
                        console.log("Supabase Client initialized successfully (delayed).");
                    } catch (error) {
                        console.error("Final attempt failed:", error);
                    }
                }
            }, 2000);
        }
    }, pollInterval);
})();
