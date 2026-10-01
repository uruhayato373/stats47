import { redirect } from "next/navigation";

/** 旧 URL。週次と月次は別ページに分けた (/strategy/reviews/weekly・/strategy/reviews/monthly)。 */
export default function Page() {
  redirect("/strategy/reviews/weekly");
}
