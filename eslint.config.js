import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import svelteConfig from './svelte.config.js';

export default defineConfig(
	// Global ignores
	{
		ignores: ['build', '.svelte-kit']
	},

	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs.recommended,

	// General language options for all files
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			},
			ecmaVersion: 2020,
			sourceType: 'module'
		}
	},

	// Svelte files config
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser,
				svelteConfig
			}
		}
	},

	// Prettier config (must be last to override other formatting rules)
	prettier
);
