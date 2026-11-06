import { redirect } from "next/navigation";

/** 問いの一覧は論文型のタブへ移した。詳細 (/content/questions/<id>) は残す */
export default function QuestionsPage() {
  redirect("/content/types?type=paper&channel=questions");
}
