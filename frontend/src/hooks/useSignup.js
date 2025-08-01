import { useQueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { signup } from "../lib/api.js";

const useSignup = () => {
  const queryClient = useQueryClient();
  const { isPending, error, mutate } = useMutation({
    mutationFn: signup,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["authUser"] }), //to allot authUser as soon as the user sign up so it navigates to home page
  });
  return { error, isPending, signupMutation: mutate };
};

export default useSignup;
