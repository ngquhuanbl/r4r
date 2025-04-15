export default function Loading() {
  return (
    <div className="container mx-auto py-6">
			<div className="flex gap-4 items-center"> 
      	<h1 className="text-2xl font-bold">Your Businesses</h1>
				<div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-black dark:border-white"></div>
			</div>
    </div>
  );
}
