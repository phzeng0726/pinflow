package sync

import "testing"

func TestSupabaseConfigurationUsesEmbeddedValuesAndEnvironmentOverrides(t *testing.T) {
	previousURL := defaultSupabaseURL
	previousKey := defaultSupabaseAnonKey
	defaultSupabaseURL = "https://embedded.example"
	defaultSupabaseAnonKey = "embedded-key"
	t.Cleanup(func() {
		defaultSupabaseURL = previousURL
		defaultSupabaseAnonKey = previousKey
	})

	t.Setenv("PINFLOW_SUPABASE_URL", "")
	t.Setenv("PINFLOW_SUPABASE_ANON_KEY", "")
	if got := SupabaseURL(); got != "https://embedded.example" {
		t.Fatalf("expected embedded URL, got %q", got)
	}
	if got := SupabaseAnonKey(); got != "embedded-key" {
		t.Fatalf("expected embedded anon key, got %q", got)
	}
	if !SupabaseConfigured() {
		t.Fatal("expected embedded values to configure Supabase")
	}

	t.Setenv("PINFLOW_SUPABASE_URL", "https://runtime.example")
	t.Setenv("PINFLOW_SUPABASE_ANON_KEY", "runtime-key")
	if got := SupabaseURL(); got != "https://runtime.example" {
		t.Fatalf("expected runtime URL override, got %q", got)
	}
	if got := SupabaseAnonKey(); got != "runtime-key" {
		t.Fatalf("expected runtime anon key override, got %q", got)
	}
}

func TestSupabaseConfigurationCanBeUnavailableWithoutBlockingLocalUse(t *testing.T) {
	previousURL := defaultSupabaseURL
	previousKey := defaultSupabaseAnonKey
	defaultSupabaseURL = ""
	defaultSupabaseAnonKey = ""
	t.Cleanup(func() {
		defaultSupabaseURL = previousURL
		defaultSupabaseAnonKey = previousKey
	})
	t.Setenv("PINFLOW_SUPABASE_URL", "")
	t.Setenv("PINFLOW_SUPABASE_ANON_KEY", "")

	if SupabaseConfigured() {
		t.Fatal("expected missing deployment values to leave cloud sync unconfigured")
	}
}
