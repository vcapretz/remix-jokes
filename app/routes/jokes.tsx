import { LinksFunction, LoaderFunction, useLoaderData } from "remix";
import { Link, Outlet } from "remix";

import stylesUrl from "~/styles/jokes.css";
import { db } from "~/utils/db.server";

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: stylesUrl }];
};

type LoaderData = {
  jokes: { id: string; name: string }[];
};

export const loader: LoaderFunction = async (): Promise<LoaderData> => {
  const jokes = await db.joke.findMany({
    select: { id: true, name: true, content: true },
    orderBy: { createdAt: "desc" },
  });

  return { jokes };
};

export default function JokesRoute() {
  const { jokes } = useLoaderData<LoaderData>();

  return (
    <div className="jokes-layout">
      <header className="jokes-header">
        <div className="container">
          <h1 className="home-link">
            <Link to="/" title="Remix Jokes" aria-label="Remix Jokes">
              <span className="logo">🤪</span>
              <span className="logo-medium">J🤪KES</span>
            </Link>
          </h1>
        </div>
      </header>

      <main className="jokes-main">
        <div className="container">
          <div className="jokes-list">
            <Link to=".">Get a random joke</Link>
            <p>Here are a few more jokes to check out:</p>

            <ul>
              {jokes.map((joke) => (
                <li key={joke.id}>
                  <Link to={joke.id}>{joke.name}</Link>
                </li>
              ))}
            </ul>

            <Link to="new" className="button">
              Add your own
            </Link>
          </div>

          <div className="jokes-outlet">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
