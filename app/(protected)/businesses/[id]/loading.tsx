import { Button } from "@/components/ui/button";
import Link from 'next/link';

export default function Loading() {
  return (
		<div className="container mx-auto py-6 max-w-2xl">
			<div className="flex items-center gap-4">
				<Link href="/businesses">
					<Button variant="ghost" size="sm">← Back</Button>
				</Link>
				<h1 className="text-2xl font-bold">Manage Business</h1>
				<div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-black dark:border-white"></div>
			</div>
			
		</div>
  );
}
