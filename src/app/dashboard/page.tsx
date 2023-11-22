import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";

const Page = async () => {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  //   if (user) {
  //    return <div>{user.email}</div>;
  //  } else {
  //    return <div>User not found</div>;
  //  }

  if (!user || !user.id) redirect("/auth-callback?origin=dashboard");

  const dbUser = await db.user.findFirst({
    where: {
      id: user.id,
    },
  });

  if(!dbUser) redirect('/auth-callback?origin=dashboard')

  return <div>{user.email}</div>;
};

export default Page;
