import Svg, { Path } from "react-native-svg"
const SvgComponent = (props) => (
    <Svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 17 20"
        width={17}
        height={20}
        fill="none"
        {...props}
    >
        <Path
            fill="#43B0AB"
            d="M8.5 0A8.5 8.5 0 0 1 17 8.5a8.465 8.465 0 0 1-2.01 5.49h-.001l-.008.01H15l-5.044 5.355a2 2 0 0 1-2.911 0L2 14h.019l-.009-.01-.01-.013A8.45 8.45 0 0 1 0 8.5 8.5 8.5 0 0 1 8.5 0Zm0 5.5a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"
        />
    </Svg>
)
export default SvgComponent
