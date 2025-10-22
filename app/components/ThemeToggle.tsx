"use client";

type Props = {
	theme: "light" | "dark";
	onToggle: () => void;
};

export default function ThemeToggle({ theme, onToggle }: Props) {
	const isDark = theme === "dark";
	return (
		<button
			type="button"
			aria-pressed={isDark}
			title={isDark ? "Switch to light mode" : "Switch to dark mode"}
			onClick={onToggle}
			className={`relative inline-flex items-center gap-2 rounded-md border px-3 py-1.5 transition-colors select-none focus:outline-none focus:ring-2 focus:ring-offset-2 ${
				isDark
					? "border-gray-600 bg-gray-800 text-white hover:bg-gray-700 focus:ring-gray-600"
					: "border-gray-300 bg-white text-gray-800 hover:bg-gray-50 focus:ring-gray-300"
			}`}
		>
			<span
				className={`h-2.5 w-2.5 rounded-full ${isDark ? "bg-green-500" : "bg-gray-400"}`}
			/>
			<span className="text-sm font-medium">{isDark ? "Dark: On" : "Dark: Off"}</span>
		</button>
	);
}

