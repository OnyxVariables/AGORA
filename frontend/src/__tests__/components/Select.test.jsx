import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Select from "../../components/Select/Select";

describe("Select", () => {
  it("renders options and calls onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <Select
        id="s1"
        label="Elegir"
        value="2"
        onChange={onChange}
        options={[
          { value: 1, label: "Uno" },
          { value: 2, label: "Dos" },
        ]}
        placeholderLabel="—"
        placeholderValue=""
      />,
    );

    expect(screen.getByLabelText("Elegir")).toHaveValue("2");
    await user.selectOptions(screen.getByLabelText("Elegir"), "1");
    expect(onChange).toHaveBeenCalled();
  });
});
