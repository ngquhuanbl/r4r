import clsx from 'clsx'
import { forwardRef } from 'react'

const Container = ({ children, className, ...props }) => {
  return (
    <div className={clsx("bg-white dark:bg-black shadow dark:shadow-gray-600 rounded-lg overflow-hidden p-6 flex justify-between items-center", className)} {...props}>
      {children}
    </div>
  )
}

export default Container