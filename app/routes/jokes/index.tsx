import { Joke } from "@prisma/client";
import { Link, LoaderFunction, useCatch, useLoaderData } from "remix";
import { db } from "~/utils/db.server";

type LoaderData = {
  joke: Joke;
};

export const loader: LoaderFunction = async (): Promise<LoaderData> => {
  const count = await db.joke.count();
  const randomRowNumber = Math.floor(Math.random() * count);

  const [joke] = await db.joke.findMany({
    take: 1,
    skip: randomRowNumber,
  });

  if (!joke) {
    throw new Response("No random joke found", {
      status: 404,
    });
  }

  return { joke };
};

export default function JokesIndexRoute() {
  const data = useLoaderData<LoaderData>();

  return (
    <div>
      <p>Here's a random joke:</p>
      <p>{data.joke.content}</p>
      <Link to={data.joke.id}>"{data.joke.name}" Permalink</Link>
    </div>
  );
}

export function CatchBoundary() {
  const caught = useCatch();

  if (caught.status === 404) {
    return (
      <div className="error-container">There are no jokes to display.</div>
    );
  }

  throw new Error(`Unexpected caught response with status: ${caught.status}`);
}

export function ErrorBoundary() {
  return <div className="error-container">I did a whoopsies.</div>;
}
