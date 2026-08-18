import { useParams } from 'react-router-dom';

export function TransferDetail() {
  const { id } = useParams();

  return (
    <div>
      <h1>Transfer Detail</h1>
      <p>Transfer ID: {id}</p>
      <p>From / To / Amount / Date</p>
    </div>
  );
}
