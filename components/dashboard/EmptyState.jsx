export default function EmptyState({ heading, body }) {
  return (
    <div className="text-center py-10 border border-dashed border-gray-300 rounded-lg">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">{heading}</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">{body}</p>
    </div>
  );
}