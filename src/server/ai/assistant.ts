import { createClient } from "@supabase/supabase-js";
import { convertToModelMessages, type UIMessage } from "ai";

import { createResponsesCall } from "./responses";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";

const INSTRUCTIONS = `إنت "مساعد ماڤيا"، المساعد الذكي لمنصة ماڤيا (MAVIA) التعليمية. اتكلم بالعربي بلهجة مصرية ودودة وبإجابات قصيرة وواضحة.

معلومات عن المنصة:
- ماڤيا منصة معمولة خصيصًا لجميع الدفعات من الفرقة الأولى للرابعة، بتضم جميع مواد كل دفعة على حدى بالملخصات والاختبارات الشاملة، وكورسات تعليمية مفيدة للـ GIS والبرمجة بشكل عام.
- التسجيل بالاسم ورقم التليفون والباسورد والسنة الدراسية، والدخول برقم التليفون والباسورد.
- أقسام المنصة:
  1. الرئيسية: تعريف بالمنصة ولوحة التصدر الخاصة بكل دفعة. النقاط = مجموع أعلى درجة للطالب في كل اختبار حله على المنصة.
  2. الكورسات: مواد كل فرقة، وجوه كل مادة الملخصات والاختبارات. الأدمن هو اللي بيضيف المواد والملخصات والاختبارات.
  3. Learning: روابط فيديوهات يوتيوب ومنصات تعليمية في الـ GIS والبرمجة، بتفتح المصدر على طول.
  4. حاسبة GPA: جدول بتكتب فيه كل مادة وساعاتها ودرجة الميد (من 20) وأعمال السنة/التكليفات (من 20) والفاينل (من 60)، وبتطلعلك التقدير والمعدل من 4. السلم: 90+ A=4.0، 85 A-=3.7، 80 B+=3.3، 75 B=3.0، 70 C+=2.7، 65 C=2.4، 60 D+=2.2، 50 D=2.0، أقل من 50 F.
  5. الكوميونتي: روابط جروبات الدفعات، وشات جوه المنصة لكل دفعة يتواصلوا فيه، وإنت (المساعد الذكي).
- ممكن كمان تساعد الطلاب في أسئلة عامة عن المذاكرة والـ GIS والبرمجة.
لو حد سأل عن حاجة مش موجودة في المنصة قول بصراحة إنها مش موجودة. ما تخترعش معلومات عن المواد أو الدرجات.`;

function json(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function verifyUser(request: Request): Promise<boolean> {
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "");
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!token || !url || !key) return false;
  const supabase = createClient(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getUser(token);
  return !error && !!data.user;
}

export async function handleAssistant(request: Request): Promise<Response> {
  if (!(await verifyUser(request))) return json(401, "سجّل دخول الأول.");

  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return json(500, "المساعد مش متوصّل دلوقتي.");

  let messages: UIMessage[];
  try {
    const body = (await request.json()) as { messages?: UIMessage[] };
    if (!Array.isArray(body.messages)) throw new Error("bad body");
    messages = body.messages.slice(-30);
  } catch {
    return json(400, "طلب غير صحيح.");
  }

  const modelMessages = await convertToModelMessages(messages);
  return createResponsesCall(
    request,
    { baseURL: GATEWAY_URL, apiKey, model: MODEL },
    modelMessages,
    INSTRUCTIONS,
  ).response();
}
