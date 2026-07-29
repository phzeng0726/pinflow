package sync_test

import (
	"testing"

	pinflowsync "pinflow/sync"
)

func TestSupabaseConfigurationUsesEmbeddedValuesAndEnvironmentOverrides(t *testing.T) {
	values := map[string]string{}
	lookup := func(key string) string { return values[key] }

	config := pinflowsync.ResolveSupabaseConfig(
		"https://embedded.example",
		"embedded-key",
		lookup,
	)
	if config.URL != "https://embedded.example" {
		t.Fatalf("expected embedded URL, got %q", config.URL)
	}
	if config.AnonKey != "embedded-key" {
		t.Fatalf("expected embedded anon key, got %q", config.AnonKey)
	}

	values["PINFLOW_SUPABASE_URL"] = "https://runtime.example"
	values["PINFLOW_SUPABASE_ANON_KEY"] = "runtime-key"
	config = pinflowsync.ResolveSupabaseConfig(
		"https://embedded.example",
		"embedded-key",
		lookup,
	)
	if config.URL != "https://runtime.example" {
		t.Fatalf("expected runtime URL override, got %q", config.URL)
	}
	if config.AnonKey != "runtime-key" {
		t.Fatalf("expected runtime anon key override, got %q", config.AnonKey)
	}
}

func TestSupabaseConfigurationCanBeUnavailableWithoutBlockingLocalUse(t *testing.T) {
	config := pinflowsync.ResolveSupabaseConfig("", "", func(string) string { return "" })
	if config.URL != "" || config.AnonKey != "" {
		t.Fatalf("expected unavailable Supabase config, got %#v", config)
	}
}
