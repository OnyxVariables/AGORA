import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider, useAuth } from "../../components/PrivateRoute/AuthContext";

function Consumer() {
  const { userRole, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="role">{userRole ?? "null"}</span>
      <button type="button" onClick={() => login(2)}>
        in
      </button>
      <button type="button" onClick={() => logout()}>
        out
      </button>
    </div>
  );
}

vi.mock("../../services/xsrf", () => ({
  getXsrfToken: vi.fn(async () => "tok"),
}));

global.fetch = vi.fn(async () => ({ ok: true, json: async () => ({}) }));

describe("AuthContext", () => {
  it("login updates role", () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Consumer />
        </AuthProvider>
      </MemoryRouter>,
    );
    expect(screen.getByTestId("role").textContent).toBe("null");
    fireEvent.click(screen.getByText("in"));
    expect(screen.getByTestId("role").textContent).toBe("2");
  });
});
