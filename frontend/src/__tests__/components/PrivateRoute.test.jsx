import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import PrivateRoute from "../../components/PrivateRoute/PrivateRoute";
import { AuthProvider } from "../../components/PrivateRoute/AuthContext";

function Child() {
  return <div data-testid="child">inside</div>;
}

describe("PrivateRoute", () => {
  it("redirects when no role in context", () => {
    render(
      <MemoryRouter initialEntries={["/x"]}>
        <AuthProvider>
          <Routes>
            <Route element={<PrivateRoute roleRequired={2} />}>
              <Route path="/x" element={<Child />} />
            </Route>
            <Route path="/" element={<div data-testid="home">home</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );
    expect(screen.getByTestId("home")).toBeInTheDocument();
  });
});
