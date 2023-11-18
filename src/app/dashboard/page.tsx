import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

const Page = async () => {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (user) {
   return <div>{user.email}</div>;
 } else {
   return <div>User not found</div>;
 }
};

export default Page;


