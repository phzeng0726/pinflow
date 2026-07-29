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

func SupabaseURL() string {
	if value := os.Getenv("PINFLOW_SUPABASE_URL"); value != "" {
		return value
	}
	return defaultSupabaseURL
}

func SupabaseAnonKey() string {
	if value := os.Getenv("PINFLOW_SUPABASE_ANON_KEY"); value != "" {
		return value
	}
	return defaultSupabaseAnonKey
}

func SupabaseConfigured() bool {
	return SupabaseURL() != "" && SupabaseAnonKey() != ""
}
