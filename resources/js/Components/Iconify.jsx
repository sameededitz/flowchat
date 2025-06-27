import { Icon } from '@iconify/react'

function Iconify({ icon, size = 24, color = 'currentColor', className = '' }) {
    return (
        <Icon
            icon={icon}
            width={size}
            height={size}
            color={color}
             className={`inline-block ${className}`}
        />
    )
}

export default Iconify