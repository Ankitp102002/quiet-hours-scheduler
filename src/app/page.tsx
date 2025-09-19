import Image from "next/image";

  export default function Home() {
  return (
    <div>
      <h1>Quiet Hours Scheduler</h1>
      <p>Schedule your focus time and get reminders!</p>
      <ol>
        <li>Login with your email</li>
        <li>Create quiet hour blocks</li>
        <li>Get email reminders 10 minutes before they start</li>
      </ol>
    </div>
  );
}