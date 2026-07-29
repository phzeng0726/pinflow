package sync

import "os"

// These values are intentionally empty in source and can be embedded into a
// release binary with:
//
//	-ldflags "-X pinflow/sync.defaultSupabaseURL=... -X pinflow/sync.defaultSupabaseAnonKey=..."
//
// Environment variables always take precedence at runtime.
var defaultSupabaseURL string
var defaultSupabaseAnonKey string

// SupabaseConfig contains the resolved public connection settings.
type SupabaseConfig struct {
	URL     string
	AnonKey string
}

// ResolveSupabaseConfig resolves environment overrides over embedded defaults.
func ResolveSupabaseConfig(
	embeddedURL string,
	embeddedAnonKey string,
	lookupEnv func(string) string,
) SupabaseConfig {
	if lookupEnv == nil {
		lookupEnv = os.Getenv
	}
	config := SupabaseConfig{
		URL:     embeddedURL,
		AnonKey: embeddedAnonKey,
	}
	if value := lookupEnv("PINFLOW_SUPABASE_URL"); value != "" {
		config.URL = value
	}
	if value := lookupEnv("PINFLOW_SUPABASE_ANON_KEY"); value != "" {
		config.AnonKey = value
	}
	return config
}

func resolvedSupabaseConfig() SupabaseConfig {
	return ResolveSupabaseConfig(defaultSupabaseURL, defaultSupabaseAnonKey, os.Getenv)
}

func SupabaseURL() string {
	return resolvedSupabaseConfig().URL
}

func SupabaseAnonKey() string {
	return resolvedSupabaseConfig().AnonKey
}

func SupabaseConfigured() bool {
	return SupabaseURL() != "" && SupabaseAnonKey() != ""
}
