import "./CardForm.css";

export default function CardForm({ formData, onChange, onSubmit }) {
  return (
    <form className="card-form" onSubmit={onSubmit}>
      <div className="form-field">
        <label>Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={onChange}
          placeholder="Enter name"
        />
      </div>

      <div className="form-field">
        <label>Company</label>
        <input
          type="text"
          name="company"
          value={formData.company}
          onChange={onChange}
          placeholder="Enter company"
        />
      </div>

      <div className="form-field">
        <label>Phone</label>
        <input
          type="text"
          name="phone"
          value={formData.phone}
          onChange={onChange}
          placeholder="Enter phone"
        />
      </div>

      <div className="form-field">
        <label>Email</label>
        <input
          type="text"
          name="email"
          value={formData.email}
          onChange={onChange}
          placeholder="Enter email"
        />
      </div>

      <div className="form-field">
        <label>Website</label>
        <input
          type="text"
          name="website"
          value={formData.website}
          onChange={onChange}
          placeholder="Enter website"
        />
      </div>

      <div className="form-field">
        <label>City</label>
        <input
          type="text"
          name="city"
          value={formData.city}
          onChange={onChange}
          placeholder="Enter city"
        />
      </div>

      <button type="submit" className="submit-btn">
        Submit
      </button>
    </form>
  );
}
