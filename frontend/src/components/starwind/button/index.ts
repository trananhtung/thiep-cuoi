import type { VariantProps } from "tailwind-variants";

import Button from "./Button.astro";
import { button } from "./variants";

export type ButtonVariants = VariantProps<typeof button>;

export { Button };

export default Button;
