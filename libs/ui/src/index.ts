// @athena/ui public entry. Importing the package injects the shared theme
// (see styles.css → @athena/design-tokens). The theme lives in
// @athena/design-tokens and the icon registry data in @athena/icons; ui owns
// the React components that render them — starting with the <Icon> web renderer.
import './styles.css';

export { Icon, type IconProps } from './foundations/Icon';
