import { Joke } from "@prisma/client";
import {
  ActionFunction,
  Form,
  Link,
  LoaderFunction,
  MetaFunction,
  redirect,
  useCatch,
  useLoaderData,
  useParams,
} from "remix";
import { JokeDisplay } from "~/components/joke";
import { db } from "~/utils/db.server";
import { getUserId, requireUserId } from "~/utils/session.server";

export const meta: MetaFunction = ({
  data,
}: {
  data: LoaderData | undefined;
}) => {
  if (!data) {
    return {
      title: "No joke",
      description: "No joke found",
    };
  }

  return {
    title: `"${data.joke.name}" joke`,
    description: `Enjoy the "${data.joke.name}" joke and much more`,
  };
};

type LoaderData = {
  isOwner: boolean;
  joke: Joke;
};

export const loader: LoaderFunction = async ({
  params,
  request,
}): Promise<LoaderData> => {
  const joke = await db.joke.findUnique({ where: { id: params.jokeId } });

  if (!joke) {
    throw new Response("What a joke! Not found", {
      status: 404,
    });
  }

  const userId = await getUserId(request);

  return { joke, isOwner: userId === joke.jokesterId };
};

export const action: ActionFunction = async ({ request, params }) => {
  const form = await request.formData();

  if (form.get("_action") !== "delete") {
    throw new Response(`The _action ${form.get("_action")} is not supported`, {
      status: 400,
    });
  }

  const userId = await requireUserId(request);
  const joke = await db.joke.findUnique({
    where: { id: params.jokeId },
  });

  if (!joke) {
    throw new Response("Can't delete what doesn't exist", {
      status: 404,
    });
  }

  if (joke.jokesterId !== userId) {
    throw new Response("Nice try, not your joke", {
      status: 401,
    });
  }

  await db.joke.delete({ where: { id: params.jokeId } });
  return redirect("/jokes");
};

export default function JokeRoute() {
  const data = useLoaderData<LoaderData>();

  return <JokeDisplay joke={data.joke} isOwner={data.isOwner} />;
}

export function CatchBoundary() {
  const caught = useCatch();
  const params = useParams();

  if (caught.status === 400) {
    return (
      <div className="error-container">
        What you're trying to do is not allowed.
      </div>
    );
  }

  if (caught.status === 401) {
    return (
      <div className="error-container">
        Sorry, but {params.jokeId} is not your joke.
      </div>
    );
  }

  if (caught.status === 404) {
    return (
      <div className="error-container">
        Huh? What the heck is "{params.jokeId}"?
      </div>
    );
  }

  throw new Error(`Unhandled error: ${caught.status}`);
}

export function ErrorBoundary() {
  const { jokeId } = useParams();

  return (
    <div className="error-container">{`There was an error loading joke by the id ${jokeId}. Sorry.`}</div>
  );
}
