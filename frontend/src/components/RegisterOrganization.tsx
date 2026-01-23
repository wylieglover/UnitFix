import { useState } from "react";
import { registerOrganization } from "../services/organization";

export const RegisterOrganization = () => {
  const [form, setForm] = useState({
    organizationName: "",
    contactInfo: "",
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await registerOrganization(form);
      console.log("Registered:", result);
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <h2>Create Organization</h2>

      <input name="organizationName" onChange={onChange} placeholder="Organization Name" />
      <input name="contactInfo" onChange={onChange} placeholder="Contact Info" />
      <input name="name" onChange={onChange} placeholder="Your Name" />
      <input name="email" type="email" onChange={onChange} placeholder="Email" />
      <input name="password" type="password" onChange={onChange} placeholder="Password" />

      {error && <p style={{ color: "red" }}>{error}</p>}
      <button disabled={loading}>
        {loading ? "Creating..." : "Register"}
      </button>
    </form>
  );
};
